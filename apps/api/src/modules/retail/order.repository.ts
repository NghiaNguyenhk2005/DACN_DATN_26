import type { OrderRecord, OrderStatus } from "./order.types";

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus;
}

export abstract class OrderRepository {
  abstract nextId(): Promise<string>;
  /** Số thứ tự trong ngày (giờ Việt Nam) cho mã đơn FM-yymmdd-NNNN. */
  abstract nextSequence(dayKey: string): Promise<number>;
  abstract create(order: OrderRecord): Promise<void>;
  abstract update(order: OrderRecord): Promise<void>;
  abstract findById(id: string): Promise<OrderRecord | null>;
  /** Mới nhất trước. */
  abstract find(filter: OrderFilter): Promise<OrderRecord[]>;
  /** Đơn trả trước còn ở `placed` mà hạn giữ chỗ đã tới (so theo chuỗi ISO UTC). */
  abstract findHoldsDueBy(isoTime: string): Promise<OrderRecord[]>;
}
