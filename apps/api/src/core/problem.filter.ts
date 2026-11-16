import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger, NotFoundException } from "@nestjs/common";
import type { Request, Response } from "express";
import type { Problem } from "@farmery/contract";
import { problem, ProblemException } from "./problem";

interface ValidatorError {
  status: number;
  message: string;
  errors?: { path: string; message: string }[];
}

// Lỗi do middleware của Express/body-parser ném ra (http-errors): có status 4xx và type máy đọc được.
interface HttpishError {
  status?: number;
  statusCode?: number;
  type?: string;
  expose?: boolean;
}

const HTTP_ERROR_TYPES: Record<string, { status: number; code: string; title: string }> = {
  "entity.too.large": { status: 413, code: "PAYLOAD_TOO_LARGE", title: "Nội dung gửi lên quá lớn" },
  "entity.parse.failed": { status: 400, code: "INVALID_JSON", title: "Nội dung không phải JSON hợp lệ" },
  "encoding.unsupported": { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", title: "Kiểu mã hóa nội dung không được hỗ trợ" },
  "charset.unsupported": { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", title: "Bộ ký tự không được hỗ trợ" },
  "request.aborted": { status: 400, code: "BAD_REQUEST", title: "Yêu cầu bị ngắt giữa chừng" },
  "request.size.invalid": { status: 400, code: "BAD_REQUEST", title: "Kích thước yêu cầu không khớp" },
  "stream.encoding.set": { status: 400, code: "BAD_REQUEST", title: "Yêu cầu không hợp lệ" },
};

type RequestWithContext = Request & { id?: string; openapi?: unknown };

function isValidatorError(e: unknown): e is ValidatorError {
  return typeof e === "object" && e !== null && typeof (e as ValidatorError).status === "number" && "errors" in e;
}

function isHttpishError(e: unknown): e is HttpishError {
  if (typeof e !== "object" || e === null) return false;
  const status = (e as HttpishError).status ?? (e as HttpishError).statusCode;
  return typeof status === "number" && status >= 400 && status < 500 && (e as HttpishError).expose === true;
}

// Mọi lỗi trả về dạng application/problem+json (RFC 9457). Lỗi 5xx không bao giờ lộ chi tiết nội bộ.
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest<RequestWithContext>();
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toProblem(exception, req);
    if (req.id) body.instance = `urn:request:${req.id}`;

    if (body.status >= 500 && body.code !== "NOT_IMPLEMENTED") {
      this.logger.error(`[${req.id ?? "-"}] ${req.method} ${req.path}`, exception instanceof Error ? exception.stack : String(exception));
    }
    if (res.headersSent) {
      res.end();
      return;
    }
    if (exception instanceof ProblemException) res.set(exception.headers);
    // Dùng res.end để bộ kiểm phản hồi theo hợp đồng không chặn chính thông báo lỗi.
    res.status(body.status).type("application/problem+json").end(JSON.stringify(body));
  }

  private toProblem(exception: unknown, req: RequestWithContext): Problem {
    if (exception instanceof ProblemException) {
      return problem(exception.getStatus(), exception.code, { code: exception.code, detail: exception.message });
    }
    if (exception instanceof NotFoundException && !req.route) {
      // Có trong hợp đồng mà chưa có endpoint thì 501; đường dẫn không thuộc hợp đồng thì 404.
      if (req.openapi) {
        return problem(501, "Chưa hiện thực", {
          code: "NOT_IMPLEMENTED",
          detail: `${req.method} ${req.path} có trong hợp đồng nhưng chưa có endpoint`,
        });
      }
      return problem(404, "Không tìm thấy", { code: "NOT_FOUND", detail: "Đường dẫn không tồn tại" });
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) return problem(status, "Lỗi máy chủ", { code: "INTERNAL" });
      return problem(status, exception.message);
    }
    if (isValidatorError(exception)) {
      const status = exception.status;
      const code = status >= 500 ? "RESPONSE_CONTRACT_MISMATCH" : status === 404 || status === 405 ? "NOT_IN_CONTRACT" : "VALIDATION_FAILED";
      return problem(status, status >= 500 ? "Phản hồi lệch hợp đồng" : "Yêu cầu không hợp lệ", {
        code,
        detail: status >= 500 ? undefined : exception.message,
        errors: exception.errors?.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    if (isHttpishError(exception)) {
      const known = exception.type ? HTTP_ERROR_TYPES[exception.type] : undefined;
      if (known) return problem(known.status, known.title, { code: known.code });
      const status = exception.status ?? exception.statusCode ?? 400;
      return problem(status, "Yêu cầu không hợp lệ", { code: "BAD_REQUEST" });
    }
    return problem(500, "Lỗi máy chủ", { code: "INTERNAL" });
  }
}
