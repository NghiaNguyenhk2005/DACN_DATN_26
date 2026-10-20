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
