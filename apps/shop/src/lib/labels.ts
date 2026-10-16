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
