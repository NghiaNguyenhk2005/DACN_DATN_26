import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  ProductRepository,
  type ProductCard,
  type ProductDetail,
  type ProductFilter,
  type ProductSearchResult,
} from "./product.repository";
import { matchSearchQuery, removeVietnameseTones } from "./utils/vietnamese-search.util";

type ProductWithCategory = ProductDetail & { categoryId?: string };

@Injectable()
export class InMemoryProductRepository extends ProductRepository implements Resettable {
  private products: ProductWithCategory[] = createSeed().products as ProductWithCategory[];

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.products = createSeed().products as ProductWithCategory[];
  }

  private toCard(p: ProductWithCategory): ProductCard {
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      categoryName: p.categoryName,
      supplier: p.supplier,
      certifications: p.certifications,
      inSeason: p.inSeason,
      listing: p.listing,
    };
  }

  async search(filter: ProductFilter): Promise<ProductSearchResult> {
    const scoredItems: { product: ProductWithCategory; score: number }[] = [];

    for (const p of this.products) {
      // 1. Lọc theo q (bỏ dấu + gần đúng)
      let score = 0;
      if (filter.q && filter.q.trim()) {
        const searchText = `${p.name} ${p.categoryName ?? ""} ${p.description ?? ""}`;
        const matchRes = matchSearchQuery(searchText, filter.q);
        if (!matchRes.matched) continue;
        score = matchRes.score;
      }

      // 2. Lọc theo categoryId
      if (filter.categoryId && p.categoryId !== filter.categoryId) {
        continue;
      }

      // 3. Lọc theo region (vùng trồng)
      if (filter.region && filter.region.trim()) {
        const normRegion = removeVietnameseTones(filter.region);
        const normSupplierRegion = removeVietnameseTones(p.supplier.growingRegion);
        if (!normSupplierRegion.includes(normRegion)) {
          continue;
        }
      }

      // 4. Lọc theo chứng nhận (cert)
      if (filter.cert && !p.certifications.includes(filter.cert)) {
        continue;
      }

      // 5. Lọc theo tồn kho (inStock)
      if (filter.inStock !== undefined) {
        const hasStock = Boolean(p.listing && p.listing.available > 0);
        if (filter.inStock !== hasStock) {
          continue;
        }
      }

      // 6. Lọc theo mùa vụ (inSeason)
      if (filter.inSeason !== undefined && p.inSeason !== filter.inSeason) {
        continue;
      }

      // 7. Lọc theo khoảng giá
      if (filter.minPrice !== undefined) {
        if (!p.listing || p.listing.unitPrice < filter.minPrice) {
          continue;
        }
      }
      if (filter.maxPrice !== undefined) {
        if (!p.listing || p.listing.unitPrice > filter.maxPrice) {
          continue;
        }
      }

      scoredItems.push({ product: p, score });
    }

    // Sắp xếp ưu tiên độ khớp tìm kiếm nếu có q
    if (filter.q && filter.q.trim()) {
      scoredItems.sort((a, b) => b.score - a.score);
    }

    // Phân trang cursor (dạng số thứ tự offset)
    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    let offset = 0;
    if (filter.cursor) {
      const parsed = parseInt(filter.cursor, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        offset = parsed;
      }
    }

    const paged = scoredItems.slice(offset, offset + limit);
    const hasNext = offset + limit < scoredItems.length;
    const nextCursor = hasNext ? String(offset + limit) : null;

    return {
      items: paged.map((item) => this.toCard(item.product)),
      nextCursor,
    };
  }

  async findById(id: string): Promise<ProductDetail | null> {
    const found = this.products.find((p) => p.id === id);
    if (!found) return null;
    return structuredClone(found);
  }

  async findBySupplierId(supplierId: string): Promise<ProductCard[]> {
    return this.products
      .filter((p) => p.supplier.id === supplierId)
      .map((p) => this.toCard(p));
  }

  async findSimilar(categoryId: string, excludeId: string, limit = 4): Promise<ProductCard[]> {
    return this.products
      .filter((p) => p.categoryId === categoryId && p.id !== excludeId)
      .slice(0, limit)
      .map((p) => this.toCard(p));
  }
}
