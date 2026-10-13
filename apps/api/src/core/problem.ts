import { HttpException } from "@nestjs/common";
import type { Problem } from "@farmery/contract";

// Lỗi nghiệp vụ có mã máy đọc được (Problem.code trong openapi.yaml), vd STOCK_CONFLICT.
export class ProblemException extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    detail?: string,
  ) {
    super(detail ?? code, status);
  }
}

export function problem(status: number, title: string, extra: Partial<Problem> = {}): Problem {
  return { type: "about:blank", title, status, ...extra };
}
