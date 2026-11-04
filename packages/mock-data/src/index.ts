import type { Schema } from "@farmery/contract";
import { categories } from "./categories";
import { suppliers, suppliersData } from "./suppliers";
import { products } from "./products";
import { batches } from "./batches";
import { farmingLogs } from "./farming-logs";

export { categories } from "./categories";
export { suppliers, suppliersData } from "./suppliers";
export { products } from "./products";
export { batches } from "./batches";
export { farmingLogs } from "./farming-logs";

export const supplierProfiles: Schema<"SupplierProfile">[] = suppliersData.map((s) => ({
  id: s.id,
  displayName: s.displayName,
  growingRegion: s.growingRegion,
  description: s.description,
  avatarUrl: s.avatarUrl,
  growingAreaCode: s.growingAreaCode,
  reputationScore: s.reputationScore,
  certifications: s.certifications,
  products: products
    .filter((p) => p.supplier.id === s.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      categoryName: p.categoryName,
      supplier: p.supplier,
      certifications: p.certifications,
      inSeason: p.inSeason,
      listing: p.listing,
    })),
}));

export interface Seed {
  categories: Schema<"Category">[];
  suppliers: Schema<"SupplierRef">[];
  supplierProfiles: Schema<"SupplierProfile">[];
  products: Schema<"ProductDetail">[];
  batches: Schema<"Batch">[];
  farmingLogs: Schema<"FarmingLog">[];
}

/** Ngày dữ liệu mẫu được viết. createSeed dời ngày của lô và nhật ký theo ngày chạy để demo luôn có hàng còn hạn. */
export const SEED_ANCHOR_DATE = "2026-10-16";
const DAY_MS = 86_400_000;

/** Số ngày từ mốc tới hôm nay theo giờ Việt Nam; không dời lùi. */
export function seedShiftDays(today: Date = new Date()): number {
  const vnDate = new Date(today.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  const diff = (Date.parse(`${vnDate}T00:00:00Z`) - Date.parse(`${SEED_ANCHOR_DATE}T00:00:00Z`)) / DAY_MS;
  return Math.max(0, Math.round(diff));
}

const shiftDate = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const shiftTime = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY_MS).toISOString().replace(".000Z", "Z");

export function createSeed(today: Date = new Date()): Seed {
  const seed: Seed = structuredClone({
    categories,
    suppliers,
    supplierProfiles,
    products,
    batches,
    farmingLogs,
  });
  const days = seedShiftDays(today);
  if (days === 0) return seed;
  for (const b of seed.batches) {
    b.harvestDate = shiftDate(b.harvestDate, days);
    b.bestBefore = shiftDate(b.bestBefore, days);
    b.createdAt = shiftTime(b.createdAt, days);
    if (b.recalledAt) b.recalledAt = shiftTime(b.recalledAt, days);
  }
  for (const p of seed.products) {
    for (const b of p.batchesOnSale) {
      b.harvestDate = shiftDate(b.harvestDate, days);
      b.bestBefore = shiftDate(b.bestBefore, days);
    }
  }
  for (const l of seed.farmingLogs) {
    l.activityDate = shiftDate(l.activityDate, days);
    l.createdAt = shiftTime(l.createdAt, days);
  }
  return seed;
}
