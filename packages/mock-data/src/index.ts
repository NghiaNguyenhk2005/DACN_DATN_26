import type { Schema } from "@farmery/contract";

export const categories: Schema<"Category">[] = [
  {
    id: "1",
    name: "Trái cây",
    isLeaf: false,
    children: [{ id: "11", name: "Xoài", isLeaf: true, children: [] }],
  },
];

export const suppliers: Schema<"SupplierRef">[] = [
  { id: "101", displayName: "HTX Xoài cát Hòa Lộc", growingRegion: "Cái Bè, Đồng Tháp" },
];

export interface Seed {
  categories: Schema<"Category">[];
  suppliers: Schema<"SupplierRef">[];
}

export function createSeed(): Seed {
  return structuredClone({ categories, suppliers });
}
