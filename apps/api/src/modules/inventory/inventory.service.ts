import { HttpStatus, Injectable } from "@nestjs/common";
import { Clock } from "../../core/clock";
import { KeyedMutex } from "../../core/mutex";
import { ProblemException } from "../../core/problem";
import { InventoryRepository } from "./inventory.repository";
import type {
  Allocation,
  HoldingFilter,
  HoldingRecord,
  MovementType,
  OpenFromBatchInput,
  Reservation,
  ReservationLine,
  StockHolding,
  StockLine,
  StockMovement,
} from "./stock.types";

const LOCK = "stock";

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function available(h: HoldingRecord): number {
  return h.isLocked ? 0 : round3(h.qtyOnHand - h.qtyReserved);
}

function toHolding(h: HoldingRecord): StockHolding {
  return {
    id: h.id,
    batchId: h.batchId,
    batchCode: h.batchCode,
    productName: h.productName,
    ownerType: h.ownerType,
    locationType: h.locationType,
    saleUnit: h.saleUnit,
    qtyOnHand: h.qtyOnHand,
    qtyReserved: h.qtyReserved,
    isLocked: h.isLocked,
  };
}

// Dòng tồn theo lô và sổ nhập xuất. Giữ chỗ theo FEFO (hết hạn trước, xuất trước); đơn giữ chỗ → trừ tồn khi thanh toán
// (retail_out) hoặc nhả khi hủy/quá hạn (release). Mọi thao tác ghi chạy tuần tự dưới một khóa.
@Injectable()
export class InventoryService {
  private readonly mutex = new KeyedMutex();

  constructor(
    private readonly repo: InventoryRepository,
    private readonly clock: Clock,
  ) {}

  /** Lượng còn bán được của một tin bán = Σ (tồn − đang giữ chỗ) các dòng chưa khóa. */
  async availableForListing(listingId: string): Promise<number> {
    const holdings = await this.repo.findHoldings({ listingId });
    return round3(holdings.reduce((sum, h) => sum + available(h), 0));
  }

  async availabilityByListing(): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const h of await this.repo.findHoldings()) {
      result.set(h.listingId, round3((result.get(h.listingId) ?? 0) + available(h)));
    }
    return result;
  }

  async listHoldings(filter: HoldingFilter): Promise<StockHolding[]> {
    const rows = await this.repo.findHoldings(filter);
    return rows.sort((a, b) => a.bestBefore.localeCompare(b.bestBefore) || Number(a.id) - Number(b.id)).map(toHolding);
  }

  async listMovements(holdingId: string): Promise<StockMovement[]> {
    if (!(await this.repo.findHolding(holdingId))) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy dòng tồn với ID: ${holdingId}`);
    }
    const rows = await this.repo.findMovements(holdingId);
    return rows.map((row) => ({
      id: row.id,
      movementType: row.movementType,
      quantity: row.quantity,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      reason: row.reason,
      createdAt: row.createdAt,
    }));
  }

  /** Lô được duyệt thì mở một dòng tồn của Farmery bằng đúng số lượng khai báo. Gọi lại với cùng lô không làm gì. */
  openFromBatch(input: OpenFromBatchInput): Promise<void> {
    return this.mutex.runExclusive(LOCK, async () => {
      if ((await this.repo.findHoldings({ batchId: input.batchId })).length > 0) return;
      const id = await this.repo.nextHoldingId();
      await this.repo.saveHolding({
        id,
        batchId: input.batchId,
        batchCode: input.batchCode,
        productName: input.productName,
        productId: input.productId,
        listingId: input.listingId,
        ownerType: "farmery",
        locationType: "farmery_warehouse",
        saleUnit: input.saleUnit,
        qtyOnHand: round3(input.quantity),
        qtyReserved: 0,
        isLocked: false,
        harvestDate: input.harvestDate,
        bestBefore: input.bestBefore,
      });
      await this.move(id, "open_from_batch", round3(input.quantity), "batch", input.batchId, "Nhập kho từ lô đã duyệt");
    });
  }

  /**
   * Giữ chỗ cho cả đơn hoặc không giữ gì cả. Mỗi dòng lấy theo FEFO, có thể trải qua nhiều lô.
   * Thiếu hàng ở bất kỳ dòng nào thì 409 STOCK_CONFLICT và không đổi gì.
   */
  reserve(ref: string, lines: StockLine[]): Promise<Allocation[]> {
    return this.mutex.runExclusive(LOCK, async () => {
      if (await this.repo.findReservation(ref)) {
        throw new ProblemException(HttpStatus.CONFLICT, "STOCK_CONFLICT", `Đơn ${ref} đã giữ chỗ trước đó`);
      }
      const pool = new Map<string, HoldingRecord>(); // dòng tồn đã sửa trong bộ nhớ, chỉ ghi khi đủ hàng
      const plan: Allocation[] = [];
      for (const line of lines) {
        let remaining = round3(line.quantity);
        const holdings = (await this.repo.findHoldings({ listingId: line.listingId }))
          .map((h) => pool.get(h.id) ?? h)
          .filter((h) => available(h) > 0)
          .sort(
            (a, b) =>
              a.bestBefore.localeCompare(b.bestBefore) ||
              a.harvestDate.localeCompare(b.harvestDate) ||
              Number(a.id) - Number(b.id),
          );
        for (const h of holdings) {
          if (remaining <= 0) break;
          const take = round3(Math.min(available(h), remaining));
          h.qtyReserved = round3(h.qtyReserved + take);
          pool.set(h.id, h);
          plan.push({ listingId: line.listingId, holdingId: h.id, batchId: h.batchId, batchCode: h.batchCode, quantity: take });
          remaining = round3(remaining - take);
        }
        if (remaining > 0) {
          throw new ProblemException(
            HttpStatus.CONFLICT,
            "STOCK_CONFLICT",
            `Tin bán ${line.listingId} không đủ hàng: còn thiếu ${remaining}`,
          );
        }
      }
      for (const h of pool.values()) await this.repo.saveHolding(h);
      for (const a of plan) await this.move(a.holdingId, "reserve", -a.quantity, "retail_order", ref, "Giữ chỗ cho đơn");
      await this.repo.saveReservation({ ref, status: "active", lines: plan.map(toReservationLine) });
      return plan;
    });
  }

  /** Nhả giữ chỗ (đơn bị hủy hoặc quá hạn trước khi thanh toán). Không làm gì nếu không còn ở trạng thái giữ chỗ. */
  release(ref: string, reason: string): Promise<void> {
    return this.settle(ref, "active", "released", async (h, line) => {
      h.qtyReserved = round3(h.qtyReserved - line.quantity);
      await this.move(h.id, "release", line.quantity, "retail_order", ref, reason);
    });
  }

  /** Đổi giữ chỗ thành trừ tồn khi đơn đã thanh toán hoặc COD hợp lệ. */
  consume(ref: string): Promise<void> {
    return this.settle(ref, "active", "consumed", async (h, line) => {
      h.qtyReserved = round3(h.qtyReserved - line.quantity);
      h.qtyOnHand = round3(h.qtyOnHand - line.quantity);
      await this.move(h.id, "retail_out", -line.quantity, "retail_order", ref, "Trừ tồn khi đơn đã thanh toán");
    });
  }

  /** Hoàn tồn đã trừ khi đơn đã thanh toán bị hủy trước đóng gói. */
  returnIn(ref: string, reason: string): Promise<void> {
    return this.settle(ref, "consumed", "returned", async (h, line) => {
      h.qtyOnHand = round3(h.qtyOnHand + line.quantity);
      await this.move(h.id, "return_in", line.quantity, "retail_order", ref, reason);
    });
  }

  private settle(
    ref: string,
    from: Reservation["status"],
    to: Reservation["status"],
    apply: (holding: HoldingRecord, line: ReservationLine) => Promise<void>,
  ): Promise<void> {
    return this.mutex.runExclusive(LOCK, async () => {
      const reservation = await this.repo.findReservation(ref);
      if (!reservation || reservation.status !== from) return;
      for (const line of reservation.lines) {
        const holding = await this.repo.findHolding(line.holdingId);
        if (!holding) continue;
        await apply(holding, line);
        await this.repo.saveHolding(holding);
      }
      await this.repo.saveReservation({ ...reservation, status: to });
    });
  }

  private move(
    holdingId: string,
    movementType: MovementType,
    quantity: number,
    sourceType: string,
    sourceId: string,
    reason: string,
  ): Promise<void> {
    return this.repo.addMovement({
      holdingId,
      movementType,
      quantity,
      sourceType,
      sourceId,
      reason,
      createdAt: this.clock.now().toISOString(),
    });
  }
}

function toReservationLine(a: Allocation): ReservationLine {
  return { holdingId: a.holdingId, listingId: a.listingId, quantity: a.quantity };
}
