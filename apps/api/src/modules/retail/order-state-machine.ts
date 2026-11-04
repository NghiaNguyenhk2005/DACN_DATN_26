import type { Schema } from "@farmery/contract";

export type OrderStatus = Schema<"OrderStatus">;
export type RoleCode = Schema<"RoleCode">;

// Tám bước trên dòng thời gian của đơn lẻ (FR5.4); nhánh còn lại là disputed, cancelled, returned.
export const TIMELINE: readonly OrderStatus[] = [
  "placed",
  "paid",
  "packing",
  "on_trip",
  "handed_to_3pl",
  "delivering",
  "delivered",
  "completed",
];

// Mọi cạnh hợp lệ của máy trạng thái. `disputed` (Khiếu nại) và `returned` do luồng đổi trả (FR8.3) đẩy vào,
// prototype chưa có thao tác nào đi tới chúng nên chỉ khai ở đây để luật gom một chỗ.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["paid", "cancelled"],
  paid: ["packing", "cancelled"],
  packing: ["on_trip"],
  on_trip: ["handed_to_3pl"],
  handed_to_3pl: ["delivering"],
  delivering: ["delivered"],
  delivered: ["completed", "disputed"],
  disputed: ["returned", "completed"],
  completed: [],
  cancelled: [],
  returned: [],
};

export function isTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Bước kế tiếp mà nhân viên bấm "chuyển bước"; null khi đơn chưa thanh toán hoặc đã kết thúc. */
export function nextStaffStep(from: OrderStatus): OrderStatus | null {
  if (from === "placed") return null; // chờ thanh toán, không phải việc của nhân viên
  const i = TIMELINE.indexOf(from);
  if (i === -1 || i === TIMELINE.length - 1) return null;
  return TIMELINE[i + 1] ?? null;
}

// Ai được chuyển bước nào: vận hành chuyển được mọi bước; kho chỉ các bước phía kho
// (paid → packing → on_trip → handed_to_3pl). Hợp đồng chỉ cho hai vai trò này gọi advance.
const WAREHOUSE_TARGETS: ReadonlySet<OrderStatus> = new Set(["packing", "on_trip", "handed_to_3pl"]);

export function canStaffAdvanceTo(roles: readonly RoleCode[], to: OrderStatus): boolean {
  if (roles.includes("staff_operations")) return true;
  return roles.includes("staff_warehouse") && WAREHOUSE_TARGETS.has(to);
}

/** Khách chỉ hủy được trước khi đóng gói. */
export function isCancellable(status: OrderStatus): boolean {
  return status === "placed" || status === "paid";
}
