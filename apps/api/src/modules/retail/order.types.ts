import type { Schema } from "@farmery/contract";

export type OrderItem = Schema<"OrderItem">;
export type OrderStatusEvent = Schema<"OrderStatusEvent">;
export type OrderStatus = Schema<"OrderStatus">;
export type AddressInput = Schema<"AddressInput">;

export interface CartLine {
  listingId: string;
  quantity: number;
}

export type CancelReason = "reservation_expired" | "buyer_cancelled";

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  /** Số dòng hàng khách đặt (một dòng có thể tách thành nhiều `items` khi FEFO lấy từ nhiều lô). */
  lineCount: number;
  address: AddressInput;
  deliveryDate: string;
  deliverySlot: string;
  paymentOption: Schema<"PaymentOption">;
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  placedAt: string;
  reserveExpiresAt: string | null;
  timeline: OrderStatusEvent[];
  cancelReason: CancelReason | null;
}
