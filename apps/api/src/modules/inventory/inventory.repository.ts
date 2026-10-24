import type { HoldingFilter, HoldingRecord, MovementRecord, Reservation } from "./stock.types";

export abstract class InventoryRepository {
  abstract findHoldings(filter?: HoldingFilter & { listingId?: string }): Promise<HoldingRecord[]>;
  abstract findHolding(id: string): Promise<HoldingRecord | null>;
  abstract saveHolding(holding: HoldingRecord): Promise<void>;
  abstract nextHoldingId(): Promise<string>;
  abstract findMovements(holdingId: string): Promise<MovementRecord[]>;
  abstract addMovement(movement: Omit<MovementRecord, "id">): Promise<void>;
  abstract findReservation(ref: string): Promise<Reservation | null>;
  abstract saveReservation(reservation: Reservation): Promise<void>;
}
