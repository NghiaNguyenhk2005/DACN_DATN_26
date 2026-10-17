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
    }

    return this.getReviewTask(taskId);
  }

  async createBatchReviewTask(batch: Schema<"Batch">): Promise<ReviewTask> {
    const now = new Date();
    const due = new Date(now.getTime() + 48 * 3600 * 1000);
    const taskRecord: ReviewTaskRecord = {
      id: String(Date.now()),
      taskType: "batch",
      targetId: batch.id,
      status: "open",
      title: `Lô ${batch.batchCode} — ${batch.productName}`,
      dueAt: due.toISOString(),
      createdAt: now.toISOString(),
      decisionReason: null,
      decidedAt: null,
    };
    return this.reviewTasks.create(taskRecord);
  }
}
