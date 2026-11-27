import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  PaymentRepository,
  type CommissionRecord,
  type InvoiceRecord,
  type PaymentRecord,
  type RefundRecord,
} from "./payment.repository";

@Injectable()
export class InMemoryPaymentRepository extends PaymentRepository implements Resettable {
  private records = new Map<string, PaymentRecord>();
  private refunds = new Map<string, RefundRecord>();
  private invoices = new Map<string, InvoiceRecord>();
  private commissions = new Map<string, CommissionRecord>();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.records.clear();
    this.refunds.clear();
    this.invoices.clear();
    this.commissions.clear();
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const found = this.records.get(orderId);
    return found ? structuredClone(found) : null;
  }

  async save(record: PaymentRecord): Promise<boolean> {
    const existing = this.records.get(record.orderId);
    if (existing && existing.status !== "failed" && existing.status !== "expired") return false;
    this.records.set(record.orderId, structuredClone(record));
    return true;
  }

  async saveRefund(record: RefundRecord): Promise<boolean> {
    const payment = this.records.get(record.orderId);
    if (payment?.status !== "succeeded" && payment?.status !== "cod_confirmed") return false;
    this.refunds.set(record.orderId, structuredClone(record));
    this.records.set(record.orderId, { ...payment, status: "refunded" });
    return true;
  }

  async findInvoice(orderId: string): Promise<InvoiceRecord | null> {
    const invoice = this.invoices.get(orderId);
    return invoice ? structuredClone(invoice) : null;
  }

  async saveInvoice(record: InvoiceRecord): Promise<InvoiceRecord> {
    const existing = this.invoices.get(record.orderId);
    if (existing) return structuredClone(existing);
    this.invoices.set(record.orderId, structuredClone(record));
    return record;
  }

  async saveCommission(record: CommissionRecord): Promise<CommissionRecord> {
    const existing = this.commissions.get(record.orderId);
    if (existing) return structuredClone(existing);
    this.invoices.set(record.orderId, structuredClone(record.invoice));
    this.commissions.set(record.orderId, structuredClone(record));
    return record;
  }
}
