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
