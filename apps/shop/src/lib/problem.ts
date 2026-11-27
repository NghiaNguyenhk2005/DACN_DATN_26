import type { Problem } from "@farmery/contract";

/** Kết quả trả về từ Server Action cho Client Component (thao tác ghi). */
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; message: string; code?: string };

const MESSAGES: Record<string, string> = {
  OTP_INVALID: "Mã OTP không đúng.",
  OTP_EXPIRED: "Mã OTP đã hết hạn, vui lòng gửi lại mã.",
  CART_QTY_EXCEEDS_STOCK: "Số lượng vượt quá lượng còn bán được.",
  STOCK_CONFLICT: "Một số sản phẩm vừa hết hàng trong lúc đặt. Vui lòng kiểm tra lại giỏ hàng.",
  COD_NOT_ALLOWED: "Đơn này không áp dụng thanh toán khi nhận hàng (COD).",
  SLOT_UNAVAILABLE: "Khung giờ này không còn nhận đơn. Vui lòng chọn khung giờ khác.",
  RESERVATION_EXPIRED: "Đã hết 15 phút giữ chỗ, đơn đã tự hủy. Vui lòng đặt lại.",
  ORDER_NOT_CANCELLABLE: "Đơn đã qua bước có thể hủy.",
  FORBIDDEN_ROLE: "Tài khoản này không dùng được chức năng mua hàng.",
  BATCH_DATE_INVALID: "Ngày khai báo chưa hợp lệ (không được ở tương lai, hạn sử dụng phải sau ngày thu hoạch).",
  LOG_SUPERSEDES_INVALID: "Mục nhật ký cần đính chính không tồn tại hoặc không thuộc lô này.",
  WHOLESALE_NOT_OFFERED: "Nhà cung cấp chưa nhận bán sỉ sản phẩm này.",
  BELOW_MIN_QUANTITY: "Sản lượng chưa đạt lượng tối thiểu của bảng giá sỉ.",
  VALIDATION_FAILED: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.",
  NOT_IMPLEMENTED: "Chức năng này đang được hoàn thiện phía máy chủ. Vui lòng thử lại sau.",
  RATE_LIMITED: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.",
};

export const NETWORK_MESSAGE = "Không kết nối được máy chủ Farmery. Vui lòng thử lại sau ít phút.";

export function isStockCode(code: string | undefined): boolean {
  return code === "STOCK_CONFLICT" || code === "CART_QTY_EXCEEDS_STOCK";
}

/** Số giây từ Retry-After, có thể là khoảng thời gian hoặc ngày giờ HTTP. */
export function retryAfterSeconds(response: Response): number | undefined {
  const raw = response.headers.get("retry-after")?.trim();
  if (!raw) return undefined;
  const seconds = Number(raw);
  const delay = Number.isFinite(seconds) ? seconds : (Date.parse(raw) - Date.now()) / 1000;
  return Number.isFinite(delay) ? Math.max(0, Math.ceil(delay)) : undefined;
}

export function waitText(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} phút` : `${minutes} phút ${rest} giây`;
}

/** Câu báo lỗi tiếng Việt theo `Problem.code`; mã lạ thì dùng câu dự phòng của từng thao tác. */
export function problemMessage(problem: Partial<Problem> | undefined, status: number, fallback: string): string {
  if (isStockCode(problem?.code) && problem?.detail) return `${problem.detail}. Vui lòng điều chỉnh số lượng trong giỏ hàng.`;
  if (problem?.code && MESSAGES[problem.code]) return MESSAGES[problem.code];
  if (status === 429) return MESSAGES.RATE_LIMITED;
  if (status === 501) return MESSAGES.NOT_IMPLEMENTED;
  if (status >= 500) return "Máy chủ Farmery đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  return fallback;
}
