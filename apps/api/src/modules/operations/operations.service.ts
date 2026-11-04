import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { ProblemException } from "../../core/problem";
import {
  ReviewTaskRepository,
  type ReviewTask,
  type ReviewTaskFilter,
  type ReviewTaskRecord,
  type ReviewTaskSearchResult,
} from "./review-task.repository";
import { CatalogService } from "../catalog/catalog.service";
import { SupplierService } from "../supplier/supplier.service";

export type ReviewTaskDetail = Schema<"ReviewTaskDetail">;

@Injectable()
export class OperationsService {
  constructor(
    private readonly reviewTasks: ReviewTaskRepository,
    @Inject(forwardRef(() => CatalogService))
    private readonly catalogService: CatalogService,
    @Inject(forwardRef(() => SupplierService))
    private readonly supplierService: SupplierService,
  ) {}

  listReviewTasks(filter: ReviewTaskFilter): Promise<ReviewTaskSearchResult> {
    return this.reviewTasks.find(filter);
  }

  async getReviewTask(taskId: string): Promise<ReviewTaskDetail> {
    const task = await this.reviewTasks.findById(taskId);
    if (!task) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy việc duyệt với ID: ${taskId}`,
      );
    }

    const detail: ReviewTaskDetail = {
      id: task.id,
      taskType: task.taskType,
      targetId: task.targetId,
      status: task.status,
      title: task.title,
      dueAt: task.dueAt ?? null,
      createdAt: task.createdAt,
      decisionReason: task.decisionReason ?? null,
      decidedAt: task.decidedAt ?? null,
    };

    if (task.taskType === "batch") {
      const batch = await this.catalogService.getBatchById(task.targetId);
      if (batch) {
        const product = await this.catalogService.getProduct(batch.productId);
        const supplier = product.supplier;
        const certifications = await this.supplierService.getSupplierCertifications(
          supplier.id,
        );
        const logs = await this.catalogService.getFarmingLogsByBatchId(batch.id);

        detail.batch = {
          batch,
          supplier,
          logs,
          certifications,
        };
      }
    } else if (task.taskType === "certification") {
      const review = await this.supplierService.getCertificationReview(task.targetId);
      if (review) detail.certification = review;
    } else if (task.taskType === "product") {
      const review = await this.catalogService.getProductReview(task.targetId);
      if (review) detail.product = review;
    }

    return detail;
  }

  async approveReviewTask(taskId: string): Promise<ReviewTaskDetail> {
    const task = await this.reviewTasks.findById(taskId);
    if (!task) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy việc duyệt với ID: ${taskId}`,
      );
    }

    if (task.status === "approved" || task.status === "rejected") {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        "CONFLICT",
        "Việc duyệt này đã có quyết định xử lý trước đó",
      );
    }

    const decidedAt = new Date().toISOString();
    await this.reviewTasks.update(taskId, {
      status: "approved",
      decidedAt,
      decisionReason: null,
    });

    if (task.taskType === "batch") {
      await this.catalogService.approveBatch(task.targetId);
    } else if (task.taskType === "certification") {
      await this.supplierService.decideCertification(task.targetId, true);
    } else if (task.taskType === "product") {
      await this.catalogService.decideProduct(task.targetId, true);
    }

    return this.getReviewTask(taskId);
  }

  async rejectReviewTask(taskId: string, reason: string): Promise<ReviewTaskDetail> {
    const task = await this.reviewTasks.findById(taskId);
    if (!task) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy việc duyệt với ID: ${taskId}`,
      );
    }

    if (task.status === "approved" || task.status === "rejected") {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        "CONFLICT",
        "Việc duyệt này đã có quyết định xử lý trước đó",
      );
    }

    const decidedAt = new Date().toISOString();
    await this.reviewTasks.update(taskId, {
      status: "rejected",
      decidedAt,
      decisionReason: reason,
    });

    if (task.taskType === "batch") {
      await this.catalogService.rejectBatch(task.targetId, reason);
    } else if (task.taskType === "certification") {
      await this.supplierService.decideCertification(task.targetId, false, reason);
    } else if (task.taskType === "product") {
      await this.catalogService.decideProduct(task.targetId, false, reason);
    }

    return this.getReviewTask(taskId);
  }

  createBatchReviewTask(batch: Schema<"Batch">): Promise<ReviewTask> {
    return this.createReviewTask("batch", batch.id, `Lô ${batch.batchCode} — ${batch.productName}`);
  }

  /** Việc duyệt mới ở hàng đợi, hạn xử lý 48 giờ. */
  async createReviewTask(taskType: Schema<"TaskType">, targetId: string, title: string): Promise<ReviewTask> {
    const now = new Date();
    const due = new Date(now.getTime() + 48 * 3600 * 1000);
    const taskRecord: ReviewTaskRecord = {
      id: String(Date.now()),
      taskType,
      targetId,
      status: "open",
      title,
      dueAt: due.toISOString(),
      createdAt: now.toISOString(),
      decisionReason: null,
      decidedAt: null,
    };
    return this.reviewTasks.create(taskRecord);
  }
}
