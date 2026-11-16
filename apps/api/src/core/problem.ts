import { HttpException } from "@nestjs/common";
import type { Problem } from "@farmery/contract";

// Lỗi nghiệp vụ có mã máy đọc được (Problem.code trong openapi.yaml), vd STOCK_CONFLICT.
export class ProblemException extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    detail?: string,
    /** Header đi kèm phản hồi lỗi (Retry-After, WWW-Authenticate). */
    readonly headers: Record<string, string> = {},
  ) {
    super(detail ?? code, status);
  }
}

export class RateLimitedException extends ProblemException {
  constructor(retryAfterSeconds: number, detail = "Quá nhiều yêu cầu, hãy thử lại sau") {
    super(429, "RATE_LIMITED", detail, { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) });
  }
}

export function problem(status: number, title: string, extra: Partial<Problem> = {}): Problem {
  return { type: "about:blank", title, status, ...extra };
}
