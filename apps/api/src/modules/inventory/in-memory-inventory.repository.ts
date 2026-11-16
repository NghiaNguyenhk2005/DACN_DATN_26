import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { InventoryRepository } from "./inventory.repository";
import { buildSeedStock, FIRST_HOLDING_ID } from "./seed-stock";
import type { HoldingFilter, HoldingRecord, MovementRecord, Reservation } from "./stock.types";

@Injectable()
export class InMemoryInventoryRepository extends InventoryRepository implements Resettable {
  private holdings: HoldingRecord[] = [];
  private movements: MovementRecord[] = [];
  private reservations = new Map<string, Reservation>();
  private nextHolding = FIRST_HOLDING_ID;
  private nextMovement = 1;

  constructor(registry: DemoResetRegistry) {
    super();
    this.load();
    registry.register(this);
  }

  reset(): void {
    this.load();
  }

  private load(): void {
    const seed = buildSeedStock();
    this.holdings = seed.holdings;
    this.movements = seed.movements;
    this.reservations = new Map();
    this.nextHolding = FIRST_HOLDING_ID + seed.holdings.length;
    this.nextMovement = seed.movements.length + 1;
  }

  async findHoldings(filter: HoldingFilter & { listingId?: string } = {}): Promise<HoldingRecord[]> {
    return this.holdings
      .filter(
        (h) =>
          (!filter.batchId || h.batchId === filter.batchId) &&
          (!filter.productId || h.productId === filter.productId) &&
          (!filter.listingId || h.listingId === filter.listingId),
      )
      .map((h) => structuredClone(h));
  }

  async findHolding(id: string): Promise<HoldingRecord | null> {
    const found = this.holdings.find((h) => h.id === id);
    return found ? structuredClone(found) : null;
  }

  async saveHolding(holding: HoldingRecord): Promise<void> {
    const i = this.holdings.findIndex((h) => h.id === holding.id);
    if (i === -1) this.holdings.push(structuredClone(holding));
    else this.holdings[i] = structuredClone(holding);
  }

  async nextHoldingId(): Promise<string> {
    return String(this.nextHolding++);
  }

  async findMovements(holdingId: string): Promise<MovementRecord[]> {
    return this.movements
      .filter((m) => m.holdingId === holdingId)
      .map((m) => structuredClone(m))
      .sort((a, b) => Number(b.id) - Number(a.id)); // mới nhất trước
  }

  async addMovement(movement: Omit<MovementRecord, "id">): Promise<void> {
    this.movements.push({ ...structuredClone(movement), id: String(this.nextMovement++) });
  }

  async findReservation(ref: string): Promise<Reservation | null> {
    const found = this.reservations.get(ref);
    return found ? structuredClone(found) : null;
  }

  async saveReservation(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.ref, structuredClone(reservation));
  }
}
