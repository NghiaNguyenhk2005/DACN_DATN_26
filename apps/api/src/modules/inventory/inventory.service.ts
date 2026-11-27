import { HttpStatus, Injectable } from "@nestjs/common";
import { Clock } from "../../core/clock";
import { ProblemException } from "../../core/problem";
import { InventoryRepository } from "./inventory.repository";
import { available, round3 } from "./stock-math";
import type {
  Allocation,
  HoldingFilter,
  HoldingRecord,
  OpenFromBatchInput,
  StockHolding,
  StockLine,
  StockMovement,
} from "./stock.types";

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
// (retail_out) hoặc nhả khi hủy/quá hạn (release). Tính nguyên tử của từng thao tác ghi do repository bảo đảm.
@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly clock: Clock,
  ) {}

  /** Lượng còn bán được của một tin bán = Σ (tồn − đang giữ chỗ) các dòng chưa khóa. */
  async availableForListing(listingId: string): Promise<number> {
    const holdings = await this.repo.findHoldings({ listingId });
    return round3(holdings.reduce((sum, h) => sum + available(h), 0));
  }

  availabilityByListing(): Promise<Map<string, number>> {
    return this.repo.availabilityByListing();
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
    return this.repo.openFromBatch(input, this.now());
  }

  /**
   * Giữ chỗ cho cả đơn hoặc không giữ gì cả. Mỗi dòng lấy theo FEFO, có thể trải qua nhiều lô.
   * Thiếu hàng ở bất kỳ dòng nào thì 409 STOCK_CONFLICT và không đổi gì.
   */
  reserve(ref: string, lines: StockLine[]): Promise<Allocation[]> {
    return this.repo.reserve(ref, lines, this.now());
  }

  /** Nhả giữ chỗ (đơn bị hủy hoặc quá hạn trước khi thanh toán). Không làm gì nếu không còn ở trạng thái giữ chỗ. */
  release(ref: string, reason: string): Promise<void> {
    return this.repo.settle(ref, "release", reason, this.now());
  }

  /** Đổi giữ chỗ thành trừ tồn khi đơn đã thanh toán hoặc COD hợp lệ. */
  consume(ref: string): Promise<void> {
    return this.repo.settle(ref, "consume", "", this.now());
  }

  /** Hoàn tồn đã trừ khi đơn đã thanh toán bị hủy trước đóng gói. */
  returnIn(ref: string, reason: string): Promise<void> {
    return this.repo.settle(ref, "return", reason, this.now());
  }

  private now(): string {
    return this.clock.now().toISOString();
  }
}
