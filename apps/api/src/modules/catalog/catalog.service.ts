import { HttpStatus, Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { ProblemException } from "../../core/problem";
import { CategoryRepository, type Category } from "./category.repository";
import {
  ProductRepository,
  type ProductDetail,
  type ProductFilter,
  type ProductSearchResult,
} from "./product.repository";
import { BatchRepository } from "./batch.repository";
import { SupplierService } from "../supplier/supplier.service";

export type TraceView = Schema<"TraceView">;
export type PublicFarmingLog = Schema<"PublicFarmingLog">;

@Injectable()
export class CatalogService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
    private readonly batches: BatchRepository,
    private readonly supplierService: SupplierService,
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
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy sản phẩm với ID: ${productId}`);
    }

    const batchesOnSale = await this.batches.findApprovedByProductId(productId);
    const categoryId = (product as { categoryId?: string }).categoryId ?? "";
    const similar = await this.products.findSimilar(categoryId, productId, 4);

    return {
      ...product,
      batchesOnSale: batchesOnSale.length > 0 ? batchesOnSale : product.batchesOnSale,
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

    const certifications = await this.supplierService.getSupplierCertifications(product.supplier.id);
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
      reason: isRecalled ? (batch.rejectReason ?? "Lô hàng đã bị thu hồi") : null,
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
}
