import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { OrderRepository, type OrderFilter } from "./order.repository";
import type { OrderRecord } from "./order.types";

const FIRST_ORDER_ID = 9001;

@Injectable()
export class InMemoryOrderRepository extends OrderRepository implements Resettable {
  private orders: OrderRecord[] = [];
  private nextOrderId = FIRST_ORDER_ID;
  private sequences = new Map<string, number>();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.orders = [];
    this.nextOrderId = FIRST_ORDER_ID;
    this.sequences.clear();
  }

  async nextId(): Promise<string> {
    return String(this.nextOrderId++);
  }

  async nextSequence(dayKey: string): Promise<number> {
    const next = (this.sequences.get(dayKey) ?? 0) + 1;
    this.sequences.set(dayKey, next);
    return next;
  }

  async create(order: OrderRecord): Promise<void> {
    this.orders.push(structuredClone(order));
  }

  async update(order: OrderRecord): Promise<void> {
    const i = this.orders.findIndex((o) => o.id === order.id);
    if (i !== -1) this.orders[i] = structuredClone(order);
  }

  async findById(id: string): Promise<OrderRecord | null> {
    const found = this.orders.find((o) => o.id === id);
    return found ? structuredClone(found) : null;
  }

  async find(filter: OrderFilter): Promise<OrderRecord[]> {
    return this.orders
      .filter((o) => (!filter.userId || o.userId === filter.userId) && (!filter.status || o.status === filter.status))
      .map((o) => structuredClone(o))
      .sort((a, b) => Number(b.id) - Number(a.id));
  }

  async findHoldsDueBy(isoTime: string): Promise<OrderRecord[]> {
    return this.orders
      .filter((o) => o.status === "placed" && o.reserveExpiresAt !== null && o.reserveExpiresAt <= isoTime)
      .map((o) => structuredClone(o));
  }
}
