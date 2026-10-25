import type { Schema } from "@farmery/contract";

export const MOVEMENT_LABELS: Record<Schema<"MovementType">, string> = {
  open_from_batch: "Nhập từ lô đã duyệt",
  ownership_transfer: "Chuyển chủ sở hữu",
  return_in: "Hoàn tồn",
  reserve: "Giữ chỗ",
  release: "Nhả giữ chỗ",
  retail_out: "Xuất bán lẻ (trừ tồn)",
  wholesale_out: "Xuất bán sỉ",
  write_off: "Hủy hàng",
  packing: "Đóng gói",
  refund_offset: "Bù hoàn tiền",
  recall_lock: "Khóa do thu hồi",
};

export const OWNER_LABELS = { supplier: "Nhà cung cấp", farmery: "Farmery" } as const;
export const LOCATION_LABELS = { supplier_site: "Tại nhà cung cấp", farmery_warehouse: "Kho Farmery" } as const;

export const SOURCE_LABELS: Record<string, string> = { retail_order: "Đơn lẻ", batch: "Lô hàng" };

/** Lỗi trả về từ API (problem+json) hoặc lỗi mạng thành câu hiển thị cho người dùng. */
export function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { detail?: string; title?: string };
    if (e.detail) return e.detail;
    if (e.title) return e.title;
  }
  return "Không gọi được API. Kiểm tra API đã chạy và bạn đã đăng nhập bằng tài khoản có quyền.";
}
