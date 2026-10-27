import type { Schema } from "@farmery/contract";

export const CERT_LABELS: Record<Schema<"CertType">, string> = {
  VietGAP: "VietGAP",
  GlobalGAP: "GlobalGAP",
  organic: "Hữu cơ",
  OCOP: "OCOP",
  HACCP: "HACCP",
};

export const ACTIVITY_LABELS: Record<Schema<"FarmingActivity">, string> = {
  planting: "Gieo trồng",
  care: "Chăm sóc",
  treatment: "Phòng trừ sâu bệnh",
  harvest: "Thu hoạch",
  other: "Công việc khác",
};

export const REVIEW_STATUS_LABELS: Record<Schema<"ReviewStatus">, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  hidden: "Đã ẩn",
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

export const ORDER_STATUS_LABELS: Record<Schema<"OrderStatus">, string> = {
  placed: "Đã đặt",
  paid: "Đã xác nhận",
  packing: "Đang đóng gói",
  on_trip: "Lên chuyến trung chuyển",
  handed_to_3pl: "Đơn vị vận chuyển đã nhận",
  delivering: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn tất",
  disputed: "Đang khiếu nại",
  cancelled: "Đã huỷ",
  returned: "Đã hoàn hàng",
};
