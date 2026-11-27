export type PaymentStatus = "succeeded" | "failed" | "expired" | "cod_confirmed" | "refunded";

export interface PaymentRecord {
  orderId: string;
  method: "prepaid" | "cod";
  amount: number;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
}

export interface RefundRecord {
  orderId: string;
  amount: number;
  reference: string;
  requestedBy?: string;
  returnRequestId?: string;
  completedAt: string;
}

export interface InvoiceRecord {
  orderId: string;
  buyerName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  lookupCode: string;
  issuedAt: string;
}

export interface CommissionRecord {
  orderId: string;
  supplierId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  invoice: InvoiceRecord;
}

export abstract class PaymentRepository {
  abstract findByOrderId(orderId: string): Promise<PaymentRecord | null>;
  abstract save(record: PaymentRecord): Promise<boolean>;
  abstract saveRefund(record: RefundRecord): Promise<boolean>;
  abstract findInvoice(orderId: string): Promise<InvoiceRecord | null>;
  abstract saveInvoice(record: InvoiceRecord): Promise<InvoiceRecord>;
  abstract saveCommission(record: CommissionRecord): Promise<CommissionRecord>;
}
