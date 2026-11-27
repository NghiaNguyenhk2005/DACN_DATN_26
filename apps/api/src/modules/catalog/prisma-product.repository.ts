/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import {
  ProductRepository,
  type ProductCard,
  type ProductDetail,
  type ProductFilter,
  type ProductRecord,
  type ProductSearchResult,
} from "./product.repository";
import { fold } from "./search/text-match";

const isPublic = (p: ProductRecord) => (p.status ?? "approved") === "approved";

function toRecord(row: any): ProductRecord {
  const id = row.id.toString();
  const categoryId = row.categoryId ? row.categoryId.toString() : "";
  const categoryName = row.category?.name ?? "Nông sản";
  const unitPrice = row.referenceRetailPrice ? Number(row.referenceRetailPrice) : 35000;
  const imageIds = (row.imageIds || []).map((imgId: any) => imgId.toString());
  const imageUrls = imageIds.map((imgId: string) => `http://localhost:4000/api/media/${imgId}`);
  const imageUrl = imageUrls[0] || "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600";

  return {
    id,
    name: row.name,
    description: row.description ?? "",
    unit: row.unit,
    categoryId,
    categoryName,
    imageUrls,
    imageUrl,
    supplier: {
      id: row.supplierId.toString(),
      displayName: "Nhà vườn Farmery",
      growingRegion: "Đà Lạt",
    },
    certifications: ["VietGAP"],
    inSeason: true,
    status: row.status,
    referenceRetailPrice: unitPrice,
    listing: {
      id: `listing-${id}`,
      saleUnit: row.unit,
      unitPrice,
      available: 100,
    },
    batchesOnSale: [],
    similar: [],
  };
}

function toCard(p: ProductRecord): ProductCard {
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

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async listPublicRecords(): Promise<ProductRecord[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: "approved" },
      include: { category: true },
      orderBy: { id: "asc" },
    });
    return rows.map(toRecord);
  }

  async search(filter: ProductFilter): Promise<ProductSearchResult> {
    const rows = await this.prisma.product.findMany({
      where: { status: "approved" },
      include: { category: true },
      orderBy: { id: "asc" },
    });
    const records = rows.map(toRecord);
    const byId = new Map(records.map((p) => [p.id, p]));
    const candidates = filter.rankedIds
      ? filter.rankedIds.map((id) => byId.get(id)).filter((p): p is ProductRecord => p !== undefined)
      : records;

    const matched: ProductRecord[] = [];
    for (const p of candidates) {
      if (!isPublic(p)) continue;
      if (filter.categoryId && p.categoryId !== filter.categoryId) continue;
      if (filter.region && filter.region.trim()) {
        const normRegion = fold(filter.region.trim());
        const normSupplierRegion = fold(p.supplier.growingRegion);
        if (!normSupplierRegion.includes(normRegion)) continue;
      }
      if (filter.cert && !p.certifications.includes(filter.cert)) continue;
      if (filter.inStock !== undefined) {
        const hasStock = Boolean(p.listing && p.listing.available > 0);
        if (filter.inStock !== hasStock) continue;
      }
      if (filter.inSeason !== undefined && p.inSeason !== filter.inSeason) continue;
      if (filter.minPrice !== undefined && (!p.listing || p.listing.unitPrice < filter.minPrice)) continue;
      if (filter.maxPrice !== undefined && (!p.listing || p.listing.unitPrice > filter.maxPrice)) continue;
      matched.push(p);
    }

    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    let offset = 0;
    if (filter.cursor) {
      const parsed = parseInt(filter.cursor, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) offset = parsed;
    }

    const paged = matched.slice(offset, offset + limit);
    const hasNext = offset + limit < matched.length;
    const nextCursor = hasNext ? String(offset + limit) : null;

    return {
      items: paged.map(toCard),
      nextCursor,
    };
  }

  async findById(id: string): Promise<ProductDetail | null> {
    try {
      const row = await this.prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: { category: true },
      });
      if (!row || row.status !== "approved") return null;
      return toRecord(row);
    } catch {
      return null;
    }
  }

  async findByListingId(listingId: string): Promise<ProductDetail | null> {
    const rawId = listingId.replace("listing-", "");
    return this.findById(rawId);
  }

  async findBySupplierId(supplierId: string): Promise<ProductCard[]> {
    try {
      const rows = await this.prisma.product.findMany({
        where: { supplierId: BigInt(supplierId), status: "approved" },
        include: { category: true },
      });
      return rows.map(toRecord).map(toCard);
    } catch {
      return [];
    }
  }

  async findSimilar(categoryId: string, excludeId: string, limit = 4): Promise<ProductCard[]> {
    try {
      const rows = await this.prisma.product.findMany({
        where: {
          categoryId: BigInt(categoryId),
          status: "approved",
          NOT: { id: BigInt(excludeId) },
        },
        include: { category: true },
        take: limit,
      });
      return rows.map(toRecord).map(toCard);
    } catch {
      return [];
    }
  }

  async countByCategory(): Promise<Record<string, number>> {
    const rows = await this.prisma.product.findMany({
      where: { status: "approved" },
      select: { categoryId: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (r.categoryId) {
        const catId = r.categoryId.toString();
        counts[catId] = (counts[catId] ?? 0) + 1;
      }
    }
    return counts;
  }

  async findRecord(id: string): Promise<ProductRecord | null> {
    try {
      const row = await this.prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: { category: true },
      });
      if (!row) return null;
      return toRecord(row);
    } catch {
      return null;
    }
  }

  async findRecordsBySupplier(supplierId: string): Promise<ProductRecord[]> {
    try {
      const rows = await this.prisma.product.findMany({
        where: { supplierId: BigInt(supplierId) },
        include: { category: true },
        orderBy: { id: "desc" },
      });
      return rows.map(toRecord);
    } catch {
      return [];
    }
  }

  async create(record: Omit<ProductRecord, "id">): Promise<ProductRecord> {
    const created = await this.prisma.product.create({
      data: {
        supplierId: BigInt(record.supplier.id),
        categoryId: BigInt(record.categoryId || "1"),
        name: record.name,
        description: record.description,
        unit: record.unit,
        imageIds: [],
        referenceRetailPrice: record.referenceRetailPrice ?? 0,
        status: (record.status ?? "draft") as any,
      },
      include: { category: true },
    });
    return toRecord(created);
  }

  async update(id: string, patch: Partial<ProductRecord>): Promise<ProductRecord | null> {
    try {
      const data: any = {};
      if (patch.name !== undefined) data.name = patch.name;
      if (patch.description !== undefined) data.description = patch.description;
      if (patch.unit !== undefined) data.unit = patch.unit;
      if (patch.categoryId !== undefined) data.categoryId = BigInt(patch.categoryId);
      if (patch.status !== undefined) data.status = patch.status;
      if (patch.referenceRetailPrice !== undefined) data.referenceRetailPrice = patch.referenceRetailPrice;

      const updated = await this.prisma.product.update({
        where: { id: BigInt(id) },
        data,
        include: { category: true },
      });
      return toRecord(updated);
    } catch {
      return null;
    }
  }
}
