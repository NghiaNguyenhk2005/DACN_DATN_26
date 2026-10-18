import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  ReviewTaskRepository,
  type ReviewTaskFilter,
  type ReviewTaskRecord,
  type ReviewTaskSearchResult,
} from "./review-task.repository";

function getInitialTasks(): ReviewTaskRecord[] {
  return [
    {
      id: "7001",
      taskType: "batch",
      targetId: "1016",
      status: "open",
      title: "Lô DTDL-2610-16 — Dâu tây Hana Đà Lạt (Hộp 500g)",
      dueAt: "2026-10-19T12:00:00Z",
      createdAt: "2026-10-17T06:00:00Z",
      decisionReason: null,
      decidedAt: null,
    },
  ];
}

@Injectable()
export class InMemoryReviewTaskRepository
  extends ReviewTaskRepository
  implements Resettable
{
  private tasks: ReviewTaskRecord[] = getInitialTasks();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.tasks = getInitialTasks();
  }

  async find(filter: ReviewTaskFilter): Promise<ReviewTaskSearchResult> {
    const filtered = this.tasks.filter((t) => {
      if (filter.type && t.taskType !== filter.type) return false;
      if (filter.status && t.status !== filter.status) return false;
      return true;
    });

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    let startIndex = 0;
    if (filter.cursor) {
      const idx = filtered.findIndex((t) => t.id === filter.cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const items = filtered.slice(startIndex, startIndex + limit).map((t) => ({
      id: t.id,
      taskType: t.taskType,
      targetId: t.targetId,
      status: t.status,
      title: t.title,
      dueAt: t.dueAt ?? null,
      createdAt: t.createdAt,
    }));

    const nextIndex = startIndex + limit;
    const lastItem = items[items.length - 1];
    const nextCursor =
      nextIndex < filtered.length && lastItem
        ? lastItem.id
        : null;

    return {
      items,
      nextCursor,
    };
  }

  async findById(id: string): Promise<ReviewTaskRecord | null> {
    const found = this.tasks.find((t) => t.id === id);
    if (!found) return null;
    return structuredClone(found);
  }

  async findByTargetId(targetId: string): Promise<ReviewTaskRecord | null> {
    const found = this.tasks.find((t) => t.targetId === targetId);
    if (!found) return null;
    return structuredClone(found);
  }

  async create(task: ReviewTaskRecord): Promise<ReviewTaskRecord> {
    this.tasks.unshift(structuredClone(task));
    return structuredClone(task);
  }

  async update(
    id: string,
    updates: Partial<ReviewTaskRecord>,
  ): Promise<ReviewTaskRecord | null> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const current = this.tasks[index];
    if (!current) return null;
    const updated: ReviewTaskRecord = {
      ...current,
      ...updates,
    };
    this.tasks[index] = updated;
    return structuredClone(updated);
  }
}
