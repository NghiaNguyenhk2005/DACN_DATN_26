import type { Schema } from "@farmery/contract";

export type Batch = Schema<"Batch">;
export type BatchOnSale = Schema<"BatchOnSale">;
export type FarmingLog = Schema<"FarmingLog">;

export abstract class BatchRepository {
  abstract findByTraceCode(traceCode: string): Promise<Batch | null>;
  abstract findApprovedByProductId(productId: string): Promise<BatchOnSale[]>;
  abstract findFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]>;
}
