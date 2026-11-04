import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { CartRepository } from "./cart.repository";
import type { CartLine } from "./order.types";

@Injectable()
export class InMemoryCartRepository extends CartRepository implements Resettable {
  private carts = new Map<string, Map<string, number>>();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.carts.clear();
  }

  async findLines(userId: string): Promise<CartLine[]> {
    return [...(this.carts.get(userId) ?? [])].map(([listingId, quantity]) => ({ listingId, quantity }));
  }

  async setLine(userId: string, line: CartLine): Promise<void> {
    const cart = this.carts.get(userId) ?? new Map<string, number>();
    cart.set(line.listingId, line.quantity);
    this.carts.set(userId, cart);
  }

  async removeLine(userId: string, listingId: string): Promise<void> {
    this.carts.get(userId)?.delete(listingId);
  }

  async clear(userId: string): Promise<void> {
    this.carts.delete(userId);
  }
}
