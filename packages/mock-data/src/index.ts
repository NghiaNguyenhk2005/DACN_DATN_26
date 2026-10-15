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

export function createSeed(): Seed {
  return structuredClone({
    categories,
    suppliers,
    supplierProfiles,
    products,
    batches,
    farmingLogs,
  });
}
