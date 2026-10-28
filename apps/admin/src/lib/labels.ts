import type { Schema } from "@farmery/contract";

export const TASK_TYPE_LABELS: Record<Schema<"TaskType">, string> = {
  batch: "Lô hàng",
  product: "Sản phẩm",
  supplier_profile: "Hồ sơ nhà cung cấp",
  certification: "Chứng nhận",
  flagged_review: "Đánh giá bị báo cáo",
  product_report: "Báo cáo sản phẩm",
};

export const TASK_STATUS: Record<Schema<"TaskStatus">, { label: string; color: string }> = {
  open: { label: "Chờ duyệt", color: "gold" },
  in_review: { label: "Đang duyệt", color: "blue" },
  approved: { label: "Đã duyệt", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
};

export const REVIEW_STATUS: Record<Schema<"ReviewStatus">, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "default" },
  pending_review: { label: "Chờ duyệt", color: "gold" },
  approved: { label: "Đã duyệt", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
  hidden: { label: "Đã ẩn", color: "default" },
};

export const ACTIVITY_LABELS: Record<Schema<"FarmingActivity">, string> = {
  planting: "Gieo trồng",
  care: "Chăm sóc",
  treatment: "Phòng trừ sâu bệnh",
  harvest: "Thu hoạch",
  other: "Công việc khác",
};

export const CERT_LABELS: Record<Schema<"CertType">, string> = {
  VietGAP: "VietGAP",
  GlobalGAP: "GlobalGAP",
  organic: "Hữu cơ",
  OCOP: "OCOP",
  HACCP: "HACCP",
};

/** Tám bước trên dòng thời gian đơn, theo thứ tự `POST /admin/orders/{id}/advance`. */
export const ORDER_STEPS = [
  "placed",
  "paid",
  "packing",
  "on_trip",
  "handed_to_3pl",
  "delivering",
  "delivered",
  "completed",
] as const satisfies readonly Schema<"OrderStatus">[];

export const ORDER_STATUS: Record<Schema<"OrderStatus">, { label: string; color: string }> = {
  placed: { label: "Đã đặt, chờ thanh toán", color: "gold" },
  paid: { label: "Đã xác nhận", color: "blue" },
  packing: { label: "Đang đóng gói", color: "blue" },
  on_trip: { label: "Lên chuyến trung chuyển", color: "blue" },
  handed_to_3pl: { label: "Đơn vị vận chuyển đã nhận", color: "blue" },
  delivering: { label: "Đang giao", color: "blue" },
  delivered: { label: "Đã giao", color: "cyan" },
  completed: { label: "Hoàn tất", color: "green" },
  disputed: { label: "Khiếu nại", color: "orange" },
  cancelled: { label: "Đã huỷ", color: "red" },
  returned: { label: "Đã hoàn hàng", color: "red" },
};

/** Bước kế tiếp nhân viên được bấm; null khi hợp đồng không cho chuyển (`ORDER_TRANSITION_INVALID`). */
export function nextOrderStep(status: Schema<"OrderStatus">): Schema<"OrderStatus"> | null {
  if (status === "placed" || status === "completed") return null;
  const i = (ORDER_STEPS as readonly string[]).indexOf(status);
  return i >= 0 ? (ORDER_STEPS[i + 1] ?? null) : null;
}

export const EVENT_SOURCE_LABELS: Record<Schema<"OrderStatusEvent">["source"], string> = {
  system: "Hệ thống",
  staff: "Nhân viên",
  payment_webhook: "Cổng thanh toán",
  carrier_webhook: "Đơn vị vận chuyển",
};

export const MOVEMENT_LABELS: Record<Schema<"MovementType">, string> = {
  open_from_batch: "Mở tồn từ lô",
  ownership_transfer: "Chuyển sở hữu",
  return_in: "Nhập trả",
  reserve: "Giữ chỗ",
  release: "Nhả giữ chỗ",
  retail_out: "Xuất bán lẻ",
  wholesale_out: "Xuất bán sỉ",
  write_off: "Huỷ hàng",
  packing: "Đóng gói",
  refund_offset: "Bù hoàn tiền",
  recall_lock: "Khoá do thu hồi",
};

export const HOLDING_OWNER_LABELS: Record<Schema<"StockHolding">["ownerType"], string> = {
  supplier: "Nhà cung cấp",
  farmery: "Farmery",
};

export const HOLDING_LOCATION_LABELS: Record<Schema<"StockHolding">["locationType"], string> = {
  supplier_site: "Tại nhà vườn",
  farmery_warehouse: "Kho Farmery",
};
