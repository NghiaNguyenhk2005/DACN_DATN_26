import type { Schema } from "@farmery/contract";

export type StockHolding = Schema<"StockHolding">;
export type StockMovement = Schema<"StockMovement">;
export type MovementType = Schema<"MovementType">;

/** Dòng tồn kèm các trường nội bộ phục vụ FEFO; API chỉ lộ phần `StockHolding`. */
export interface HoldingRecord extends StockHolding {
  productId: string;
  listingId: string;
  harvestDate: string;
  bestBefore: string;
}

export interface MovementRecord extends StockMovement {
  holdingId: string;
}

export type ReservationStatus = "active" | "consumed" | "released" | "returned";

export interface ReservationLine {
  holdingId: string;
  listingId: string;
  quantity: number;
}

/** Giữ chỗ của một đơn (ref = id đơn). active → consumed (trừ tồn) hoặc released (nhả); consumed → returned (hoàn tồn). */
export interface Reservation {
  ref: string;
  status: ReservationStatus;
  lines: ReservationLine[];
}

export interface StockLine {
  listingId: string;
  quantity: number;
}

export interface Allocation {
  listingId: string;
  holdingId: string;
  batchId: string;
  batchCode: string;
  quantity: number;
}

export interface OpenFromBatchInput {
  batchId: string;
  batchCode: string;
  productId: string;
  listingId: string;
  productName: string;
  saleUnit: string;
  quantity: number;
  harvestDate: string;
  bestBefore: string;
}

export interface HoldingFilter {
  batchId?: string;
  productId?: string;
}
