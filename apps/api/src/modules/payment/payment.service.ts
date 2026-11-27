import { HttpStatus, Injectable } from "@nestjs/common";
import { Clock } from "../../core/clock";
import { EventBus } from "../../core/events/event-bus";
import { KeyedMutex } from "../../core/mutex";
import { ProblemException } from "../../core/problem";
import {
  callPaymentGateway,
  PaymentGateway,
  PaymentGatewayTimeout,
  type ChargeResult,
  type DemoPaymentScenario,
} from "../../integrations/payment-gateway";
import { PaymentRepository, type CommissionRecord, type InvoiceRecord, type PaymentRecord } from "./payment.repository";

interface RefundOptions {
  requestedBy?: string;
  returnRequestId?: string;
  allowCollectedCod?: boolean;
}

@Injectable()
export class PaymentService {
  private readonly orders = new KeyedMutex();

  constructor(
    private readonly repo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly clock: Clock,
    private readonly events: EventBus,
  ) {}

  charge(orderId: string, amount: number, scenario?: DemoPaymentScenario): Promise<ChargeResult> {
    return this.orders.runExclusive(orderId, async () => {
      const existing = await this.repo.findByOrderId(orderId);
      if (existing?.status === "succeeded") {
        if (existing.amount !== amount) {
          throw new ProblemException(HttpStatus.CONFLICT, "PAYMENT_AMOUNT_CHANGED", "Số tiền giao dịch đã ghi nhận không khớp");
        }
        return { status: "succeeded", reference: existing.reference };
      }
      if (existing?.status === "refunded" || existing?.status === "cod_confirmed") {
        return { status: "failed", reference: null };
      }

      let result: ChargeResult;
      try {
        result = await callPaymentGateway((signal) => this.gateway.charge(orderId, amount, scenario, signal));
      } catch (error) {
        if (error instanceof PaymentGatewayTimeout) return { status: "expired", reference: null };
        throw error;
      }
      const saved = await this.save({ orderId, method: "prepaid", amount, ...result });
      if (saved && result.status === "succeeded") {
        await this.events.publish("PaymentSucceeded", { orderId, amount, reference: result.reference });
      }
      if (!saved) {
        const applied = await this.repo.findByOrderId(orderId);
        if (applied?.status === "succeeded" && applied.amount === amount) {
          return { status: "succeeded", reference: applied.reference };
        }
        return { status: "failed", reference: null };
      }
      return result;
    });
  }

  /** Đơn COD hợp lệ: ghi nhận xác nhận, tiền thu khi giao. */
  async confirmCod(orderId: string, amount: number): Promise<void> {
    await this.orders.runExclusive(orderId, () =>
      this.save({ orderId, method: "cod", amount, status: "cod_confirmed", reference: null }));
  }

  refund(orderId: string, options: RefundOptions = {}): Promise<void> {
    return this.orders.runExclusive(orderId, async () => {
      const record = await this.repo.findByOrderId(orderId);
      const collectedCod = record?.status === "cod_confirmed" && options.allowCollectedCod && options.returnRequestId;
      if (!record || (record.status !== "succeeded" && !collectedCod)) return;
      const paymentReference = collectedCod ? `demo-cod-${orderId}` : record.reference;
      if (!paymentReference) {
        throw new ProblemException(HttpStatus.CONFLICT, "REFUND_FAILED", "Thiếu mã giao dịch cần hoàn tiền");
      }
      const request = {
        idempotencyKey: orderId,
        paymentReference,
        amount: record.amount,
      };
      let result: ChargeResult;
      try {
        result = await callPaymentGateway((signal) => this.gateway.refund(request, signal));
      } catch (error) {
        if (!(error instanceof PaymentGatewayTimeout)) throw error;
        throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "REFUND_TIMEOUT", "Cổng thanh toán chưa xác nhận hoàn tiền");
      }
      if (result.status !== "succeeded" || !result.reference) {
        throw new ProblemException(HttpStatus.CONFLICT, "REFUND_FAILED", "Cổng thanh toán từ chối hoàn tiền");
      }
      const saved = await this.repo.saveRefund({
        requestedBy: options.requestedBy,
        returnRequestId: options.returnRequestId,
        orderId,
        amount: record.amount,
        reference: result.reference,
        completedAt: this.clock.now().toISOString(),
      });
      if (saved) await this.events.publish("Refunded", { orderId, amount: record.amount });
    });
  }

  issueRetailInvoice(orderId: string, buyerName: string, total: number, taxAmount = 0): Promise<InvoiceRecord> {
    return this.repo.saveInvoice(this.invoice(orderId, buyerName, total, taxAmount));
  }

  findInvoice(orderId: string): Promise<InvoiceRecord | null> {
    return this.repo.findInvoice(orderId);
  }

  settleWholesale(
    orderId: string, supplierId: string, grossAmount: number, commissionRate: number, supplierName = supplierId,
  ): Promise<CommissionRecord> {
    const basisPoints = Math.round(commissionRate * 10_000);
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1 || basisPoints / 10_000 !== commissionRate) {
      throw new ProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Tỷ lệ hoa hồng phải trong khoảng 0–1 và có tối đa 4 chữ số thập phân");
    }
    const grossCents = Math.round(grossAmount * 100);
    if (!Number.isSafeInteger(grossCents) || grossCents < 0) {
      throw new ProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Giá trị đơn sỉ không hợp lệ");
    }
    const commissionAmount = Number((BigInt(grossCents) * BigInt(basisPoints) + 5_000n) / 10_000n) / 100;
    return this.repo.saveCommission({
      orderId, supplierId, grossAmount, commissionRate, commissionAmount,
      invoice: this.invoice(orderId, supplierName, commissionAmount, 0),
    });
  }

  findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    return this.repo.findByOrderId(orderId);
  }

  private invoice(orderId: string, buyerName: string, total: number, taxAmount: number): InvoiceRecord {
    return {
      orderId, buyerName, total, taxAmount,
      subtotal: Math.round((total - taxAmount) * 100) / 100,
      lookupCode: `DEMO-INVOICE-${orderId}`,
      issuedAt: this.clock.now().toISOString(),
    };
  }

  private save(partial: Omit<PaymentRecord, "createdAt">): Promise<boolean> {
    return this.repo.save({ ...partial, createdAt: this.clock.now().toISOString() });
  }
}
