export type PaymentStatus = "succeeded" | "failed" | "cod_confirmed" | "refunded";

export interface PaymentRecord {
  orderId: string;
  method: "prepaid" | "cod";
  amount: number;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
}

export abstract class PaymentRepository {
  abstract findByOrderId(orderId: string): Promise<PaymentRecord | null>;
  abstract save(record: PaymentRecord): Promise<void>;
}
