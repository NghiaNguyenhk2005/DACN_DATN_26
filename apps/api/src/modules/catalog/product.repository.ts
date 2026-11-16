import type { Schema } from "@farmery/contract";

export type ProductCard = Schema<"ProductCard">;
export type ProductDetail = Schema<"ProductDetail">;
export type CertType = Schema<"CertType">;
export type ReviewStatus = Schema<"ReviewStatus">;

/** Bản ghi sản phẩm: chi tiết công khai + trường nội bộ. Thiếu `status` nghĩa là đã duyệt (dữ liệu mẫu). */
export type ProductRecord = ProductDetail & {
  categoryId?: string;
  status?: ReviewStatus;
  rejectReason?: string | null;
  referenceRetailPrice?: number | null;
};

export interface ProductFilter {
  /** Câu tìm từ HTTP; `CatalogService` đổi thành `rankedIds`, repository không đọc trường này. */
  q?: string;
  /** Id sản phẩm đã xếp hạng theo độ liên quan: chỉ trả các id này, giữ đúng thứ tự. */
  rankedIds?: string[];
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
  /** Các thao tác công khai chỉ thấy sản phẩm đã duyệt. */
  abstract search(filter: ProductFilter): Promise<ProductSearchResult>;
  /** Mọi sản phẩm đã duyệt — nguồn cho bộ tìm trong bộ nhớ. */
  abstract listPublicRecords(): Promise<ProductRecord[]>;
  abstract findById(id: string): Promise<ProductDetail | null>;
  abstract findByListingId(listingId: string): Promise<ProductDetail | null>;
  abstract findBySupplierId(supplierId: string): Promise<ProductCard[]>;
  abstract findSimilar(categoryId: string, excludeId: string, limit?: number): Promise<ProductCard[]>;
  /** Số sản phẩm đã duyệt theo id danh mục lá. */
  abstract countByCategory(): Promise<Record<string, number>>;
  /** Mọi trạng thái — cho khu nhà cung cấp và kiểm duyệt. */
  abstract findRecord(id: string): Promise<ProductRecord | null>;
  abstract findRecordsBySupplier(supplierId: string): Promise<ProductRecord[]>;
  abstract create(record: Omit<ProductRecord, "id">): Promise<ProductRecord>;
  abstract update(id: string, patch: Partial<ProductRecord>): Promise<ProductRecord | null>;
}
