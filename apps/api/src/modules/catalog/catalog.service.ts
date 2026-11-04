import { HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { ProblemException } from "../../core/problem";
import { CategoryRepository, type Category } from "./category.repository";
import {
  ProductRepository,
  type ProductDetail,
  type ProductFilter,
  type ProductSearchResult,
} from "./product.repository";
import {
  BatchRepository,
  type Batch,
  type BatchFilter,
  type FarmingLog,
} from "./batch.repository";
import { SupplierService } from "../supplier/supplier.service";
import { OperationsService } from "../operations/operations.service";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { InventoryService } from "../inventory/inventory.service";
import type { AuthUser } from "../../core/token.service";

export type TraceView = Schema<"TraceView">;
export type PublicFarmingLog = Schema<"PublicFarmingLog">;

/** Ảnh chụp tin bán cho giỏ hàng: tên, giá, đơn vị tại thời điểm đọc. */
export interface ListingSnapshot {
  listingId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  saleUnit: string;
  unitPrice: number;
}

type WithListing = { listing?: Schema<"Listing"> | null };

function withStock<T extends WithListing>(item: T, availability: Map<string, number>): T {
  if (!item.listing) return item;
  return { ...item, listing: { ...item.listing, available: availability.get(item.listing.id) ?? 0 } };
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
    private readonly batches: BatchRepository,
    private readonly supplierService: SupplierService,
    @Inject(forwardRef(() => OperationsService))
    private readonly operationsService: OperationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly inventory: InventoryService,
  ) {}

  listCategories(): Promise<Category[]> {
    return this.categories.findTree();
  }

  // Lượng còn bán được lấy từ dòng tồn (inventory), không dùng số tĩnh trong dữ liệu mẫu.
  async searchProducts(filter: ProductFilter): Promise<ProductSearchResult> {
    const availability = await this.inventory.availabilityByListing();
    if (filter.inStock === undefined) {
      const result = await this.products.search(filter);
      return { ...result, items: result.items.map((c) => withStock(c, availability)) };
    }

    // Lọc "còn hàng" theo tồn thật: lấy hết kết quả khớp, lọc rồi phân trang lại.
    const { inStock, cursor, limit, ...rest } = filter;
    const matched: ProductSearchResult["items"] = [];
    let next: string | undefined;
    do {
      const page = await this.products.search({ ...rest, cursor: next, limit: 100 });
      matched.push(...page.items);
      next = page.nextCursor ?? undefined;
    } while (next);

    const filtered = matched
      .map((c) => withStock(c, availability))
      .filter((c) => (c.listing ? c.listing.available > 0 : false) === inStock);
    const pageSize = limit && limit > 0 ? Math.min(limit, 100) : 20;
    const parsed = cursor ? parseInt(cursor, 10) : 0;
    const offset = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    return {
      items: filtered.slice(offset, offset + pageSize),
      nextCursor: offset + pageSize < filtered.length ? String(offset + pageSize) : null,
    };
  }

  /** Tin bán theo `listingId` cho giỏ hàng; null khi không có. */
  async getListing(listingId: string): Promise<ListingSnapshot | null> {
    const product = await this.products.findByListingId(listingId);
    if (!product?.listing) return null;
    return {
      listingId,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl ?? null,
      saleUnit: product.listing.saleUnit,
      unitPrice: product.listing.unitPrice,
    };
  }

  async getProduct(productId: string): Promise<ProductDetail> {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy sản phẩm với ID: ${productId}`,
      );
    }

    const batchesOnSale = await this.batches.findApprovedByProductId(productId);
    const categoryId = (product as { categoryId?: string }).categoryId ?? "";
    const similar = await this.products.findSimilar(categoryId, productId, 4);

    const availability = await this.inventory.availabilityByListing();
    return withStock(
      {
        ...product,
        batchesOnSale:
          batchesOnSale.length > 0 ? batchesOnSale : product.batchesOnSale,
        similar: similar.map((c) => withStock(c, availability)),
      },
      availability,
    );
  }

  async getPublicTrace(traceCode: string): Promise<TraceView> {
    const batch = await this.batches.findByTraceCode(traceCode);
    if (!batch || batch.status !== "approved") {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        "Mã truy xuất không tồn tại hoặc lô hàng chưa được kiểm duyệt công khai",
      );
    }

    const product = await this.products.findById(batch.productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        "Không tìm thấy thông tin sản phẩm tương ứng với lô hàng",
      );
    }

    const certifications =
      await this.supplierService.getSupplierCertifications(product.supplier.id);
    const rawLogs = await this.batches.findFarmingLogsByBatchId(batch.id);

    const logs: PublicFarmingLog[] = rawLogs.map((l) => ({
      activityDate: l.activityDate,
      activity: l.activity,
      description: l.description ?? null,
      imageUrls: l.imageUrls ?? [],
      isCorrection: Boolean(l.supersedesId),
      superseded: Boolean(l.superseded),
      enteredOnBehalf: Boolean(l.enteredBy?.onBehalf),
    }));

    const isRecalled = Boolean(batch.recalledAt);
    const recall = {
      recalled: isRecalled,
      reason: isRecalled ? batch.rejectReason ?? "Lô hàng đã bị thu hồi" : null,
      recalledAt: batch.recalledAt ?? null,
    };

    return {
      traceCode: batch.traceCode ?? traceCode,
      product: {
        id: product.id,
        name: product.name,
        categoryName: product.categoryName ?? "",
        imageUrl: product.imageUrl ?? null,
      },
      supplier: product.supplier,
      batch: {
        batchCode: batch.batchCode,
        harvestDate: batch.harvestDate,
        bestBefore: batch.bestBefore,
      },
      certifications,
      logs,
      recall,
    };
  }

  getBatchById(batchId: string): Promise<Batch | null> {
    return this.batches.findById(batchId);
  }

  getFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]> {
    return this.batches.findFarmingLogsByBatchId(batchId);
  }

  async listSellerProducts(): Promise<Schema<"SellerProduct">[]> {
    const products = await this.products.findBySupplierId("101");
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: "1",
      unit: "kg",
      status: "approved" as const,
      imageUrl: p.imageUrl,
    }));
  }

  listSellerBatches(filter: BatchFilter): Promise<Batch[]> {
    return this.batches.findBatches(filter);
  }

  async getSellerBatch(batchId: string): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }
    return batch;
  }

  async createBatch(input: Schema<"BatchInput">): Promise<Batch> {
    const product = await this.products.findById(input.productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        `Không tìm thấy sản phẩm với ID: ${input.productId}`,
      );
    }

    if (input.bestBefore <= input.harvestDate) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        "Hạn sử dụng (bestBefore) phải sau ngày thu hoạch (harvestDate)",
      );
    }

    if (input.declaredQuantity <= 0) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        "Số lượng khai báo (declaredQuantity) phải lớn hơn 0",
      );
    }

    const initials =
      product.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 4)
        .join("") || "LO";
    const yymm = new Date().toISOString().slice(2, 7).replace("-", "");
    const existing = await this.batches.findBatches({ productId: product.id });
    const seq = String(existing.length + 1).padStart(2, "0");
    const batchCode = `${initials}-${yymm}-${seq}`;

    const id = String(Date.now());
    const now = new Date().toISOString();

    const batch: Batch = {
      id,
      batchCode,
      productId: product.id,
      productName: product.name,
      harvestDate: input.harvestDate,
      bestBefore: input.bestBefore,
      declaredQuantity: input.declaredQuantity,
      status: "pending_review",
      rejectReason: null,
      traceCode: null,
      traceUrl: null,
      recalledAt: null,
      createdAt: now,
    };

    const created = await this.batches.createBatch(batch);
    await this.operationsService.createBatchReviewTask(created);
    return created;
  }

  async listFarmingLogs(batchId: string): Promise<FarmingLog[]> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }
    return this.batches.findFarmingLogsByBatchId(batchId);
  }

  async appendFarmingLog(
    batchId: string,
    input: Schema<"FarmingLogInput">,
    user?: AuthUser,
  ): Promise<FarmingLog> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    if (input.activityDate > today) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "BATCH_DATE_INVALID",
        "Ngày hoạt động (activityDate) không được ở tương lai",
      );
    }

    if (input.supersedesId) {
      const oldLog = await this.batches.findFarmingLogById(input.supersedesId);
      if (!oldLog || oldLog.batchId !== batchId) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOG_SUPERSEDES_INVALID",
          "Bản ghi nhật ký cần đính chính không tồn tại hoặc không thuộc cùng lô hàng",
        );
      }
      await this.batches.markFarmingLogSuperseded(input.supersedesId);
    }

    const isStaff = user?.roles?.some((r) => r.startsWith("staff_")) ?? false;
    const now = new Date().toISOString();

    const newLog: FarmingLog = {
      id: String(Date.now()),
      batchId,
      activityDate: input.activityDate,
      activity: input.activity,
      description: input.description ?? null,
      imageUrls: input.imageIds
        ? input.imageIds.map((id) => `http://localhost:4000/api/media/${id}`)
        : [],
      supersedesId: input.supersedesId ?? null,
      superseded: false,
      enteredBy: {
        userId: user?.id ?? "201",
        displayName: isStaff
          ? "Cán bộ hỗ trợ vùng"
          : "Người đại diện nhà cung cấp",
        onBehalf: isStaff,
      },
      createdAt: now,
    };

    return this.batches.appendFarmingLog(newLog);
  }

  async approveBatch(batchId: string): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }

    const traceCode = batch.traceCode ?? `TRC-${batch.batchCode}`;
    const shopOrigin = this.config.corsOrigins[0] ?? "http://localhost:3000";
    const traceUrl = `${shopOrigin}/truy-xuat/${traceCode}`;

    const updated = await this.batches.updateBatch(batchId, {
      status: "approved",
      rejectReason: null,
      traceCode,
      traceUrl,
    });

    // Lô được duyệt thì có hàng để bán: mở dòng tồn của Farmery bằng số lượng khai báo.
    const product = await this.products.findById(batch.productId);
    if (product?.listing) {
      await this.inventory.openFromBatch({
        batchId: batch.id,
        batchCode: batch.batchCode,
        productId: product.id,
        listingId: product.listing.id,
        productName: batch.productName,
        saleUnit: product.listing.saleUnit,
        quantity: batch.declaredQuantity,
        harvestDate: batch.harvestDate,
        bestBefore: batch.bestBefore,
      });
    }
    return updated!;
  }

  async rejectBatch(batchId: string, reason: string): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }

    const updated = await this.batches.updateBatch(batchId, {
      status: "rejected",
      rejectReason: reason,
      traceCode: null,
      traceUrl: null,
    });
    return updated!;
  }
}
