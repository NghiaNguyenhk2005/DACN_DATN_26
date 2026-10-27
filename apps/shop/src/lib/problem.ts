import type { Problem } from "@farmery/contract";

/** Kết quả trả về từ Server Action cho Client Component (thao tác ghi). */
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; message: string; code?: string };

const MESSAGES: Record<string, string> = {
  CART_QTY_EXCEEDS_STOCK: "Số lượng vượt quá lượng còn bán được.",
  STOCK_CONFLICT: "Một số sản phẩm vừa hết hàng trong lúc đặt. Vui lòng kiểm tra lại giỏ hàng.",
  COD_NOT_ALLOWED: "Đơn này không áp dụng thanh toán khi nhận hàng (COD).",
  SLOT_UNAVAILABLE: "Khung giờ này không còn nhận đơn. Vui lòng chọn khung giờ khác.",
  RESERVATION_EXPIRED: "Đã hết 15 phút giữ chỗ, đơn đã tự huỷ. Vui lòng đặt lại.",
  ORDER_NOT_CANCELLABLE: "Đơn đã qua bước có thể huỷ.",
  FORBIDDEN_ROLE: "Tài khoản này không dùng được chức năng mua hàng.",
  BATCH_DATE_INVALID: "Ngày khai báo chưa hợp lệ (không được ở tương lai, hạn dùng phải sau ngày thu hoạch).",
  LOG_SUPERSEDES_INVALID: "Mục nhật ký cần đính chính không tồn tại hoặc không thuộc lô này.",
  VALIDATION_FAILED: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.",
  NOT_IMPLEMENTED: "Chức năng này đang được hoàn thiện phía máy chủ. Vui lòng thử lại sau.",
};

export const NETWORK_MESSAGE = "Không kết nối được máy chủ Farmery. Vui lòng thử lại sau ít phút.";

/** Câu báo lỗi tiếng Việt theo `Problem.code`; mã lạ thì dùng câu dự phòng của từng thao tác. */
export function problemMessage(problem: Partial<Problem> | undefined, status: number, fallback: string): string {
  if (problem?.code && MESSAGES[problem.code]) return MESSAGES[problem.code];
  if (status === 501) return MESSAGES.NOT_IMPLEMENTED;
  if (status >= 500) return "Máy chủ Farmery đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  return fallback;
}
