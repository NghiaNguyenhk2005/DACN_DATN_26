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
import type { AuthUser } from "../../core/token.service";

export type TraceView = Schema<"TraceView">;
export type PublicFarmingLog = Schema<"PublicFarmingLog">;

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
  ) {}

  listCategories(): Promise<Category[]> {
    return this.categories.findTree();
  }

  searchProducts(filter: ProductFilter): Promise<ProductSearchResult> {
    return this.products.search(filter);
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

    return {
      ...product,
      batchesOnSale:
        batchesOnSale.length > 0 ? batchesOnSale : product.batchesOnSale,
      similar,
    };
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
        "VALIDATION_FAILED",
        "Ngày hoạt động (activityDate) không được ở tương lai",
      );
    }

    if (input.supersedesId) {
      const oldLog = await this.batches.findFarmingLogById(input.supersedesId);
      if (!oldLog || oldLog.batchId !== batchId) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "VALIDATION_FAILED",
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
