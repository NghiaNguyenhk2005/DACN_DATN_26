/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import {
  BatchRepository,
  type Batch,
  type BatchFilter,
  type BatchOnSale,
  type FarmingLog,
} from "./batch.repository";

function toBatch(row: any): Batch {
  return {
    id: row.id.toString(),
    productId: row.productId.toString(),
    productName: row.product?.name ?? "Nông sản",
    batchCode: row.batchCode,
    harvestDate: row.harvestDate instanceof Date ? row.harvestDate.toISOString().slice(0, 10) : String(row.harvestDate),
    bestBefore: row.bestBefore instanceof Date ? row.bestBefore.toISOString().slice(0, 10) : String(row.bestBefore),
    declaredQuantity: Number(row.declaredQuantity),
    traceCode: row.qrToken ?? null,
    status: row.status,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}

function toLog(row: any): FarmingLog {
  const imageIds = (row.imageIds || []).map((imgId: any) => imgId.toString());
  const imageUrls = imageIds.map((id: string) => `http://localhost:4000/api/media/${id}`);
  return {
    id: row.id.toString(),
    batchId: row.batchId.toString(),
    activityDate: row.activityDate instanceof Date ? row.activityDate.toISOString().slice(0, 10) : String(row.activityDate),
    activity: row.activity,
    description: row.description ?? "",
    imageUrls,
    supersedesId: row.supersedesId ? row.supersedesId.toString() : null,
    superseded: Boolean(row.supersedesId),
    enteredBy: {
      userId: row.enteredBy ? row.enteredBy.toString() : "1",
      displayName: "Chủ hộ",
      onBehalf: false,
    },
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}

@Injectable()
export class PrismaBatchRepository extends BatchRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async findById(id: string): Promise<Batch | null> {
    try {
      const row = await this.prisma.batch.findUnique({
        where: { id: BigInt(id) },
        include: { product: true },
      });
      return row ? toBatch(row) : null;
    } catch {
      return null;
    }
  }

  async findByTraceCode(traceCode: string): Promise<Batch | null> {
    try {
      const row = await this.prisma.batch.findUnique({
        where: { qrToken: traceCode },
        include: { product: true },
      });
      return row ? toBatch(row) : null;
    } catch {
      return null;
    }
  }

  async findApprovedByProductId(productId: string): Promise<BatchOnSale[]> {
    try {
      const rows = await this.prisma.batch.findMany({
        where: { productId: BigInt(productId), status: "approved" },
        orderBy: { harvestDate: "desc" },
      });
      return rows.map((b) => ({
        batchCode: b.batchCode,
        harvestDate: b.harvestDate instanceof Date ? b.harvestDate.toISOString().slice(0, 10) : String(b.harvestDate),
        bestBefore: b.bestBefore instanceof Date ? b.bestBefore.toISOString().slice(0, 10) : String(b.bestBefore),
        traceCode: b.qrToken,
      }));
    } catch {
      return [];
    }
  }

  async findBatches(filter: BatchFilter): Promise<Batch[]> {
    try {
      const where: any = {};
      if (filter.productId) where.productId = BigInt(filter.productId);
      if (filter.status) where.status = filter.status;

      const rows = await this.prisma.batch.findMany({
        where,
        include: { product: true },
        orderBy: { id: "desc" },
      });
      return rows.map(toBatch);
    } catch {
      return [];
    }
  }

  async createBatch(batch: Batch): Promise<Batch> {
    const created = await this.prisma.batch.create({
      data: {
        productId: BigInt(batch.productId),
        batchCode: batch.batchCode,
        harvestDate: new Date(batch.harvestDate),
        bestBefore: new Date(batch.bestBefore),
        declaredQuantity: batch.declaredQuantity,
        qrToken: batch.traceCode || `QR-${Date.now()}`,
        status: (batch.status ?? "pending_review") as any,
      },
      include: { product: true },
    });
    return toBatch(created);
  }

  async updateBatch(batchId: string, updates: Partial<Batch>): Promise<Batch | null> {
    try {
      const data: any = {};
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.declaredQuantity !== undefined) data.declaredQuantity = updates.declaredQuantity;

      const updated = await this.prisma.batch.update({
        where: { id: BigInt(batchId) },
        data,
        include: { product: true },
      });
      return toBatch(updated);
    } catch {
      return null;
    }
  }

  async findFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]> {
    try {
      const rows = await this.prisma.farmingLog.findMany({
        where: { batchId: BigInt(batchId) },
        orderBy: [{ activityDate: "asc" }, { createdAt: "asc" }],
      });
      return rows.map(toLog);
    } catch {
      return [];
    }
  }

  async findFarmingLogById(logId: string): Promise<FarmingLog | null> {
    try {
      const row = await this.prisma.farmingLog.findUnique({
        where: { id: BigInt(logId) },
      });
      return row ? toLog(row) : null;
    } catch {
      return null;
    }
  }

  async appendFarmingLog(log: FarmingLog): Promise<FarmingLog> {
    const created = await this.prisma.farmingLog.create({
      data: {
        batchId: BigInt(log.batchId),
        activityDate: new Date(log.activityDate),
        activity: log.activity,
        description: log.description,
        imageIds: [],
        enteredBy: BigInt(1),
        supersedesId: log.supersedesId ? BigInt(log.supersedesId) : null,
      },
    });
    return toLog(created);
  }

  async markFarmingLogSuperseded(logId: string): Promise<boolean> {
    try {
      await this.prisma.farmingLog.update({
        where: { id: BigInt(logId) },
        data: { supersedesId: BigInt(logId) },
      });
      return true;
    } catch {
      return false;
    }
  }
}
