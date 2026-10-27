import type { Schema } from "@farmery/contract";

export type ProductCard = Schema<"ProductCard">;
export type ProductDetail = Schema<"ProductDetail">;
export type CertType = Schema<"CertType">;

export interface ProductFilter {
  q?: string;
  categoryId?: string;
  region?: string;
  cert?: CertType;
  inStock?: boolean;
  inSeason?: boolean;
  minPrice?: number;
  maxPrice?: number;
  cursor?: string;
  limit?: number;
}

export interface ProductSearchResult {
  items: ProductCard[];
  nextCursor: string | null;
}

export abstract class ProductRepository {
  abstract search(filter: ProductFilter): Promise<ProductSearchResult>;
  abstract findById(id: string): Promise<ProductDetail | null>;
  abstract findBySupplierId(supplierId: string): Promise<ProductCard[]>;
  abstract findSimilar(categoryId: string, excludeId: string, limit?: number): Promise<ProductCard[]>;
}
