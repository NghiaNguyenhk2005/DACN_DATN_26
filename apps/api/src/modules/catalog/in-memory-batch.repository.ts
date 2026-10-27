import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  BatchRepository,
  type Batch,
  type BatchFilter,
  type BatchOnSale,
  type FarmingLog,
} from "./batch.repository";

@Injectable()
export class InMemoryBatchRepository extends BatchRepository implements Resettable {
  private batches: Batch[] = createSeed().batches;
  private farmingLogs: FarmingLog[] = createSeed().farmingLogs;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.batches = createSeed().batches;
    this.farmingLogs = createSeed().farmingLogs;
  }

  async findById(id: string): Promise<Batch | null> {
    const found = this.batches.find((b) => b.id === id);
    if (!found) return null;
    return structuredClone(found);
  }

  async findByTraceCode(traceCode: string): Promise<Batch | null> {
    const found = this.batches.find((b) => b.traceCode === traceCode);
    if (!found) return null;
    return structuredClone(found);
  }

  async findApprovedByProductId(productId: string): Promise<BatchOnSale[]> {
    return this.batches
      .filter((b) => b.productId === productId && b.status === "approved" && Boolean(b.traceCode))
      .map((b) => ({
        batchCode: b.batchCode,
        harvestDate: b.harvestDate,
        bestBefore: b.bestBefore,
        traceCode: b.traceCode!,
      }));
  }

  async findBatches(filter: BatchFilter): Promise<Batch[]> {
    return this.batches
      .filter((b) => {
        if (filter.productId && b.productId !== filter.productId) return false;
        if (filter.status && b.status !== filter.status) return false;
        return true;
      })
      .map((b) => structuredClone(b));
  }

  async createBatch(batch: Batch): Promise<Batch> {
    this.batches.unshift(structuredClone(batch));
    return structuredClone(batch);
  }

  async updateBatch(batchId: string, updates: Partial<Batch>): Promise<Batch | null> {
    const index = this.batches.findIndex((b) => b.id === batchId);
    if (index === -1) return null;
    const current = this.batches[index];
    if (!current) return null;
    const updated: Batch = {
      ...current,
      ...updates,
    };
    this.batches[index] = updated;
    return structuredClone(updated);
  }

  async findFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]> {
    return this.farmingLogs
      .filter((l) => l.batchId === batchId)
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate) || a.createdAt.localeCompare(b.createdAt))
      .map((l) => structuredClone(l));
  }

  async findFarmingLogById(logId: string): Promise<FarmingLog | null> {
    const found = this.farmingLogs.find((l) => l.id === logId);
    if (!found) return null;
    return structuredClone(found);
  }

  async appendFarmingLog(log: FarmingLog): Promise<FarmingLog> {
    this.farmingLogs.push(structuredClone(log));
    return structuredClone(log);
  }

  async markFarmingLogSuperseded(logId: string): Promise<boolean> {
    const index = this.farmingLogs.findIndex((l) => l.id === logId);
    if (index === -1) return false;
    const log = this.farmingLogs[index];
    if (!log) return false;
    log.superseded = true;
    return true;
  }
}
