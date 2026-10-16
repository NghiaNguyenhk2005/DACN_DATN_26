import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  BatchRepository,
  type Batch,
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

  async findFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]> {
    return this.farmingLogs
      .filter((l) => l.batchId === batchId)
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate));
  }
}
