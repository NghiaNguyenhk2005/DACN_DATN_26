import type { Schema } from "@farmery/contract";

export type ReviewTask = Schema<"ReviewTask">;
export type TaskType = Schema<"TaskType">;
export type TaskStatus = Schema<"TaskStatus">;

export interface ReviewTaskRecord extends ReviewTask {
  decisionReason: string | null;
  decidedAt: string | null;
}

export interface ReviewTaskFilter {
  type?: TaskType;
  status?: TaskStatus;
  cursor?: string;
  limit?: number;
}

export interface ReviewTaskSearchResult {
  items: ReviewTask[];
  nextCursor: string | null;
}

export abstract class ReviewTaskRepository {
  abstract find(filter: ReviewTaskFilter): Promise<ReviewTaskSearchResult>;
  abstract findById(id: string): Promise<ReviewTaskRecord | null>;
  abstract findByTargetId(targetId: string): Promise<ReviewTaskRecord | null>;
  abstract create(task: ReviewTaskRecord): Promise<ReviewTaskRecord>;
  abstract update(
    id: string,
    updates: Partial<ReviewTaskRecord>,
  ): Promise<ReviewTaskRecord | null>;
}
