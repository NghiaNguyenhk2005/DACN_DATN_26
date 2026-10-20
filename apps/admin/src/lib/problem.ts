import type { Problem } from "@farmery/contract";
import type { HttpError } from "@refinedev/core";

const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN_ROLE: "Tài khoản của bạn không có quyền thực hiện thao tác này.",
  TASK_ALREADY_DECIDED: "Việc duyệt này đã có quyết định trước đó.",
  CONFLICT: "Việc duyệt này đã có quyết định trước đó.",
  NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  VALIDATION_FAILED: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.",
  NOT_IMPLEMENTED: "Chức năng đang được hoàn thiện phía máy chủ.",
};

export const NETWORK_MESSAGE = "Không kết nối được máy chủ Farmery. Vui lòng thử lại sau ít phút.";

/** Câu báo lỗi tiếng Việt theo `Problem.code`; mã lạ thì dùng câu dự phòng của từng thao tác. */
export function problemMessage(problem: Partial<Problem> | undefined, status: number, fallback: string): string {
  const known = problem?.code ? MESSAGES[problem.code] : undefined;
  if (known) return known;
  if (status === 501) return "Chức năng đang được hoàn thiện phía máy chủ.";
  if (status >= 500) return "Máy chủ Farmery đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  return fallback;
}

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

/** Trả `data` của client openapi-fetch, hoặc ném `HttpError` để Refine báo lỗi và tự đăng xuất khi 401. */
export async function unwrap<T>(request: Promise<ApiResult<T>>, fallback: string): Promise<T> {
  let result: ApiResult<T>;
  try {
    result = await request;
  } catch {
    throw { message: NETWORK_MESSAGE, statusCode: 0 } satisfies HttpError;
  }
  if (result.data !== undefined) return result.data;
  const status = result.response.status;
  const message = problemMessage(result.error as Partial<Problem> | undefined, status, fallback);
  throw { message, statusCode: status } satisfies HttpError;
}
