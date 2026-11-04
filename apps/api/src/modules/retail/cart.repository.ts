import type { CartLine } from "./order.types";

export abstract class CartRepository {
  abstract findLines(userId: string): Promise<CartLine[]>;
  abstract setLine(userId: string, line: CartLine): Promise<void>;
  abstract removeLine(userId: string, listingId: string): Promise<void>;
  abstract clear(userId: string): Promise<void>;
}
