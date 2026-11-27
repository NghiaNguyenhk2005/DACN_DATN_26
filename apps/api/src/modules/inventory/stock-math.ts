import { HttpStatus } from "@nestjs/common";
import { ProblemException } from "../../core/problem";
import type {
  Allocation,
  HoldingRecord,
  MovementType,
  ReservationLine,
  ReservationStatus,
  SettleKind,
  StockLine,
} from "./stock.types";

// Phần tính toán thuần của tồn kho (FEFO, chuyển trạng thái giữ chỗ), dùng chung cho kho bộ nhớ và kho PostgreSQL.
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function available(h: HoldingRecord): number {
  return h.isLocked ? 0 : round3(h.qtyOnHand - h.qtyReserved);
}

export function byFefo(a: HoldingRecord, b: HoldingRecord): number {
  return (
    a.bestBefore.localeCompare(b.bestBefore) || a.harvestDate.localeCompare(b.harvestDate) || Number(a.id) - Number(b.id)
  );
}

export function toReservationLine(a: Allocation): ReservationLine {
  return { holdingId: a.holdingId, listingId: a.listingId, quantity: a.quantity };
}

/**
 * Lập kế hoạch giữ chỗ cho cả đơn theo FEFO, không sửa `holdings` đầu vào. Thiếu hàng ở bất kỳ dòng nào thì
 * 409 STOCK_CONFLICT. `changed` là bản sao các dòng tồn đã tăng qtyReserved, chỉ ghi khi đủ hàng.
 */
export function planReserve(holdings: HoldingRecord[], lines: StockLine[]): { plan: Allocation[]; changed: HoldingRecord[] } {
  const pool = new Map<string, HoldingRecord>();
  const plan: Allocation[] = [];
  for (const line of lines) {
    let remaining = round3(line.quantity);
    const candidates = holdings
      .filter((h) => h.listingId === line.listingId)
      .map((h) => pool.get(h.id) ?? structuredClone(h))
      .filter((h) => available(h) > 0)
      .sort(byFefo);
    for (const h of candidates) {
      if (remaining <= 0) break;
      const take = round3(Math.min(available(h), remaining));
      h.qtyReserved = round3(h.qtyReserved + take);
      pool.set(h.id, h);
      plan.push({ listingId: line.listingId, holdingId: h.id, batchId: h.batchId, batchCode: h.batchCode, quantity: take });
      remaining = round3(remaining - take);
    }
    if (remaining > 0) {
      // Nêu tên sản phẩm và lượng còn lại để khách biết phải sửa dòng nào trong giỏ.
      const left = round3(line.quantity - remaining);
      const unit = line.saleUnit ? ` ${line.saleUnit}` : "";
      throw new ProblemException(
        HttpStatus.CONFLICT,
        "STOCK_CONFLICT",
        line.productName
          ? left > 0
            ? `${line.productName}: chỉ còn ${left}${unit}`
            : `${line.productName}: vừa hết hàng`
          : `Tin bán ${line.listingId} không đủ hàng: còn thiếu ${remaining}`,
      );
    }
  }
  return { plan, changed: [...pool.values()] };
}

export function duplicateReservation(ref: string): ProblemException {
  return new ProblemException(HttpStatus.CONFLICT, "STOCK_CONFLICT", `Đơn ${ref} đã giữ chỗ trước đó`);
}

export interface SettleRule {
  from: ReservationStatus;
  to: ReservationStatus;
  movementType: MovementType;
  /** +1: sổ ghi số dương (nhả, hoàn); -1: số âm (trừ tồn). */
  sign: 1 | -1;
  /** Lý do cố định; để trống thì dùng lý do người gọi truyền vào. */
  fixedReason?: string;
  apply(holding: HoldingRecord, quantity: number): void;
}

export const SETTLE_RULES: Record<SettleKind, SettleRule> = {
  release: {
    from: "active",
    to: "released",
    movementType: "release",
    sign: 1,
    apply: (h, q) => {
      h.qtyReserved = round3(h.qtyReserved - q);
    },
  },
  consume: {
    from: "active",
    to: "consumed",
    movementType: "retail_out",
    sign: -1,
    fixedReason: "Trừ tồn khi đơn đã thanh toán",
    apply: (h, q) => {
      h.qtyReserved = round3(h.qtyReserved - q);
      h.qtyOnHand = round3(h.qtyOnHand - q);
    },
  },
  return: {
    from: "consumed",
    to: "returned",
    movementType: "return_in",
    sign: 1,
    apply: (h, q) => {
      h.qtyOnHand = round3(h.qtyOnHand + q);
    },
  },
};
