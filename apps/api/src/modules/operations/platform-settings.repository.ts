import type { Schema } from "@farmery/contract";

export type PlatformSettingsUpdate = Schema<"PlatformSettingsUpdate">;
/** Cấu hình đủ mọi khóa (nạp sẵn giá trị mặc định ở prototype). */
export type ResolvedSettings = Schema<"PlatformSettings">;

export const DEFAULT_SETTINGS: ResolvedSettings = {
  codMaxAmount: 1_000_000,
  cutoffTime: "16:00",
  deliverySlots: ["08:00-11:00", "14:00-17:00", "18:00-21:00"],
  shippingFee: 25_000,
  freeShippingThreshold: 300_000,
  reservationMinutes: 15,
  retailVatPercent: 5,
};

export abstract class PlatformSettingsRepository {
  abstract get(): Promise<ResolvedSettings>;
  abstract merge(changes: PlatformSettingsUpdate): Promise<ResolvedSettings>;
}
