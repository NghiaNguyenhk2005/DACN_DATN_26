import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger, NotFoundException } from "@nestjs/common";
import type { Request, Response } from "express";
import type { Problem } from "@farmery/contract";
import { problem, ProblemException } from "./problem";

interface ValidatorError {
  status: number;
  message: string;
  errors?: { path: string; message: string }[];
}

function isValidatorError(e: unknown): e is ValidatorError {
  return typeof e === "object" && e !== null && typeof (e as ValidatorError).status === "number" && "errors" in e;
}

// Mọi lỗi trả về dạng application/problem+json (RFC 9457).
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toProblem(exception, req);
    if (body.status >= 500 && body.code !== "NOT_IMPLEMENTED") this.logger.error(exception);
    // Dùng res.end để bộ kiểm phản hồi theo hợp đồng không chặn chính thông báo lỗi.
    res.status(body.status).type("application/problem+json").end(JSON.stringify(body));
  }

  private toProblem(exception: unknown, req: Request): Problem {
    if (exception instanceof ProblemException) {
      return problem(exception.getStatus(), exception.code, { code: exception.code, detail: exception.message });
    }
    if (exception instanceof NotFoundException && !req.route) {
      return problem(501, "Chưa hiện thực", {
        code: "NOT_IMPLEMENTED",
        detail: `${req.method} ${req.path} có trong hợp đồng nhưng chưa có endpoint`,
      });
    }
    if (exception instanceof HttpException) {
      return problem(exception.getStatus(), exception.message);
    }
    if (isValidatorError(exception)) {
      const status = exception.status;
      const code = status >= 500 ? "RESPONSE_CONTRACT_MISMATCH" : status === 404 || status === 405 ? "NOT_IN_CONTRACT" : "VALIDATION_FAILED";
      return problem(status, status >= 500 ? "Phản hồi lệch hợp đồng" : "Yêu cầu không hợp lệ", {
        code,
        detail: exception.message,
        errors: exception.errors?.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    return problem(500, "Lỗi máy chủ", { code: "INTERNAL" });
  }
}
