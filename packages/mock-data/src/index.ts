import type { Schema } from "@farmery/contract";

// Dữ liệu giả theo vùng thí điểm của báo cáo: nguồn cung Lâm Đồng, giao TP.HCM. Không dùng thông tin người thật.
export const categories: Schema<"Category">[] = [
  {
    id: "1",
    name: "Trái cây",
    isLeaf: false,
    children: [{ id: "11", name: "Dâu tây", isLeaf: true, children: [] }],
  },
];

export const suppliers: Schema<"SupplierRef">[] = [
  { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Đà Lạt, Lâm Đồng" },
];

export interface Seed {
  categories: Schema<"Category">[];
  suppliers: Schema<"SupplierRef">[];
}

export function createSeed(): Seed {
  return structuredClone({ categories, suppliers });
}
