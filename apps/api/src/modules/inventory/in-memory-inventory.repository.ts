import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { KeyedMutex } from "../../core/mutex";
import { InventoryRepository } from "./inventory.repository";
import { buildSeedStock, FIRST_HOLDING_ID } from "./seed-stock";
import { available, duplicateReservation, planReserve, round3, SETTLE_RULES, toReservationLine } from "./stock-math";
import type {
  Allocation,
  HoldingFilter,
  HoldingRecord,
  MovementRecord,
  OpenFromBatchInput,
  Reservation,
  SettleKind,
  StockLine,
} from "./stock.types";

const LOCK = "stock";

@Injectable()
export class InMemoryInventoryRepository extends InventoryRepository implements Resettable {
  private readonly mutex = new KeyedMutex();
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

  async findMovements(holdingId: string): Promise<MovementRecord[]> {
    return this.movements
      .filter((m) => m.holdingId === holdingId)
      .map((m) => structuredClone(m))
      .sort((a, b) => Number(b.id) - Number(a.id)); // mới nhất trước
  }

  async availabilityByListing(): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const h of this.holdings) result.set(h.listingId, round3((result.get(h.listingId) ?? 0) + available(h)));
    return result;
  }

  openFromBatch(input: OpenFromBatchInput, now: string): Promise<void> {
    return this.mutex.runExclusive(LOCK, async () => {
      if (this.holdings.some((h) => h.batchId === input.batchId)) return;
      const id = String(this.nextHolding++);
      const quantity = round3(input.quantity);
      this.holdings.push({
        id,
        batchId: input.batchId,
        batchCode: input.batchCode,
        productName: input.productName,
        productId: input.productId,
        listingId: input.listingId,
        ownerType: "farmery",
        locationType: "farmery_warehouse",
        saleUnit: input.saleUnit,
        qtyOnHand: quantity,
        qtyReserved: 0,
        isLocked: false,
        harvestDate: input.harvestDate,
        bestBefore: input.bestBefore,
      });
      this.addMovement(id, "open_from_batch", quantity, "batch", input.batchId, "Nhập kho từ lô đã duyệt", now);
    });
  }

  reserve(ref: string, lines: StockLine[], now: string): Promise<Allocation[]> {
    return this.mutex.runExclusive(LOCK, async () => {
      if (this.reservations.has(ref)) throw duplicateReservation(ref);
      const { plan, changed } = planReserve(this.holdings, lines);
      for (const h of changed) this.holdings[this.holdings.findIndex((x) => x.id === h.id)] = h;
      for (const a of plan) this.addMovement(a.holdingId, "reserve", -a.quantity, "retail_order", ref, "Giữ chỗ cho đơn", now);
      this.reservations.set(ref, { ref, status: "active", lines: plan.map(toReservationLine) });
      return plan;
    });
  }

  settle(ref: string, kind: SettleKind, reason: string, now: string): Promise<void> {
    return this.mutex.runExclusive(LOCK, async () => {
      const rule = SETTLE_RULES[kind];
      const reservation = this.reservations.get(ref);
      if (!reservation || reservation.status !== rule.from) return;
      for (const line of reservation.lines) {
        const holding = this.holdings.find((h) => h.id === line.holdingId);
        if (!holding) continue;
        rule.apply(holding, line.quantity);
        this.addMovement(holding.id, rule.movementType, rule.sign * line.quantity, "retail_order", ref, rule.fixedReason ?? reason, now);
      }
      this.reservations.set(ref, { ...reservation, status: rule.to });
    });
  }

  private addMovement(
    holdingId: string,
    movementType: MovementRecord["movementType"],
    quantity: number,
    sourceType: string,
    sourceId: string,
    reason: string,
    createdAt: string,
  ): void {
    this.movements.push({ id: String(this.nextMovement++), holdingId, movementType, quantity, sourceType, sourceId, reason, createdAt });
  }
}
