import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { OperationsService, type ReviewTaskDetail } from "./operations.service";
import type { ReviewTaskSearchResult } from "./review-task.repository";

@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get("admin/review-tasks")
  listReviewTasks(
    @Query("type") type?: Schema<"TaskType">,
    @Query("status") status?: Schema<"TaskStatus">,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string | number,
  ): Promise<ReviewTaskSearchResult> {
    const parseNum = (v: unknown): number | undefined => {
      if (v === undefined || v === "") return undefined;
      const parsed = Number(v);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    return this.operations.listReviewTasks({
      type,
      status,
      cursor,
      limit: parseNum(limit),
    });
  }

  @Get("admin/review-tasks/:taskId")
  getReviewTask(@Param("taskId") taskId: string): Promise<ReviewTaskDetail> {
    return this.operations.getReviewTask(taskId);
  }

  @Post("admin/review-tasks/:taskId/approve")
  @HttpCode(HttpStatus.OK)
  approveReviewTask(@Param("taskId") taskId: string): Promise<ReviewTaskDetail> {
    return this.operations.approveReviewTask(taskId);
  }

  @Post("admin/review-tasks/:taskId/reject")
  @HttpCode(HttpStatus.OK)
  rejectReviewTask(
    @Param("taskId") taskId: string,
    @Body() body: { reason: string },
  ): Promise<ReviewTaskDetail> {
    return this.operations.rejectReviewTask(taskId, body.reason);
  }
}
