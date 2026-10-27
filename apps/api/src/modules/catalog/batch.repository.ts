import type { Schema } from "@farmery/contract";

export type Batch = Schema<"Batch">;
export type BatchOnSale = Schema<"BatchOnSale">;
export type FarmingLog = Schema<"FarmingLog">;
export type ReviewStatus = Schema<"ReviewStatus">;

export interface BatchFilter {
  productId?: string;
  status?: ReviewStatus;
}

export abstract class BatchRepository {
  abstract findById(id: string): Promise<Batch | null>;
  abstract findByTraceCode(traceCode: string): Promise<Batch | null>;
  abstract findApprovedByProductId(productId: string): Promise<BatchOnSale[]>;
  abstract findBatches(filter: BatchFilter): Promise<Batch[]>;
  abstract createBatch(batch: Batch): Promise<Batch>;
  abstract updateBatch(batchId: string, updates: Partial<Batch>): Promise<Batch | null>;
  abstract findFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]>;
  abstract findFarmingLogById(logId: string): Promise<FarmingLog | null>;
  abstract appendFarmingLog(log: FarmingLog): Promise<FarmingLog>;
  abstract markFarmingLogSuperseded(logId: string): Promise<boolean>;
}
