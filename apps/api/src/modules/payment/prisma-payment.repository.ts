import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import {
  PaymentRepository,
  type CommissionRecord,
  type InvoiceRecord,
  type PaymentRecord,
  type RefundRecord,
} from "./payment.repository";

const WHOLESALE_PREFIX = "WS-ORDER-";

function source(orderId: string) {
  const wholesale = orderId.startsWith(WHOLESALE_PREFIX);
  return {
    sourceType: wholesale ? "wholesale_order" : "retail_order",
    sourceId: BigInt(wholesale ? orderId.slice(WHOLESALE_PREFIX.length) : orderId),
  };
}

function invoiceData(record: InvoiceRecord) {
  return {
    ...source(record.orderId),
    buyerName: record.buyerName,
    subtotal: record.subtotal,
    taxAmount: record.taxAmount,
    total: record.total,
    lookupCode: record.lookupCode,
    issuedAt: new Date(record.issuedAt),
  };
}

function toInvoice(orderId: string, row: {
  buyerName: string;
  subtotal: { toNumber(): number };
  taxAmount: { toNumber(): number };
  total: { toNumber(): number };
  lookupCode: string;
  issuedAt: Date;
}): InvoiceRecord {
  return {
    orderId,
    buyerName: row.buyerName,
    subtotal: row.subtotal.toNumber(),
    taxAmount: row.taxAmount.toNumber(),
    total: row.total.toNumber(),
    lookupCode: row.lookupCode,
    issuedAt: row.issuedAt.toISOString(),
  };
}

@Injectable()
export class PrismaPaymentRepository extends PaymentRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const row = await this.prisma.payment.findUnique({ where: { sourceType_sourceId: source(orderId) } });
    if (!row) return null;
    let status: PaymentRecord["status"];
    switch (row.status) {
      case "succeeded": status = row.method === "cod" ? "cod_confirmed" : "succeeded"; break;
      case "partially_refunded":
      case "refunded": status = "refunded"; break;
      case "expired": status = "expired"; break;
      default: status = "failed";
    }
    return {
      orderId,
      method: row.method === "cod" ? "cod" : "prepaid",
      status,
      reference: row.gatewayTxnRef,
      amount: row.amount.toNumber(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async save(record: PaymentRecord): Promise<boolean> {
    const key = source(record.orderId);
    const status = record.status === "cod_confirmed" ? "succeeded" : record.status;
    const data = {
      ...key,
      status,
      method: record.method === "cod" ? "cod" as const : "vietqr" as const,
      gateway: record.method === "cod" ? null : "demo",
      gatewayTxnRef: record.reference,
      amount: record.amount,
      createdAt: new Date(record.createdAt),
      paidAt: record.status === "succeeded" ? new Date(record.createdAt) : null,
    };
    const inserted = await this.prisma.payment.createMany({ data, skipDuplicates: true });
    if (inserted.count === 1) return true;
    const updated = await this.prisma.payment.updateMany({
      where: { ...key, status: { in: ["failed", "expired"] } },
      data,
    });
    return updated.count === 1;
  }

  async saveRefund(record: RefundRecord): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { sourceType_sourceId: source(record.orderId) } });
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: "succeeded" },
        data: { status: "refunded" },
      });
      if (!updated.count) return false;
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          returnRequestId: record.returnRequestId === undefined ? null : BigInt(record.returnRequestId),
          amount: record.amount,
          status: "succeeded",
          gatewayRefundRef: record.reference,
          requestedBy: record.requestedBy === undefined ? null : BigInt(record.requestedBy),
          completedAt: new Date(record.completedAt),
        },
      });
      return true;
    });
  }

  async findInvoice(orderId: string): Promise<InvoiceRecord | null> {
    const row = await this.prisma.invoice.findFirst({ where: source(orderId) });
    return row ? toInvoice(orderId, row) : null;
  }

  async saveInvoice(record: InvoiceRecord): Promise<InvoiceRecord> {
    await this.prisma.invoice.createMany({
      data: { ...invoiceData(record), kind: "retail_sale" },
      skipDuplicates: true,
    });
    const row = await this.prisma.invoice.findUniqueOrThrow({ where: { lookupCode: record.lookupCode } });
    return toInvoice(record.orderId, row);
  }

  async saveCommission(record: CommissionRecord): Promise<CommissionRecord> {
    const wholesaleOrderId = source(record.orderId).sourceId;
    return this.prisma.$transaction(async (tx) => {
      const { invoice } = record;
      await tx.invoice.createMany({
        data: { ...invoiceData(invoice), kind: "commission_service" },
        skipDuplicates: true,
      });
      const serviceInvoice = await tx.invoice.findUniqueOrThrow({ where: { lookupCode: invoice.lookupCode } });
      await tx.commissionSettlement.createMany({
        data: {
          wholesaleOrderId,
          supplierId: BigInt(record.supplierId),
          grossAmount: record.grossAmount,
          commissionRate: record.commissionRate,
          commissionAmount: record.commissionAmount,
          settledAt: new Date(invoice.issuedAt),
          serviceInvoiceId: serviceInvoice.id,
        },
        skipDuplicates: true,
      });
      const row = await tx.commissionSettlement.findUniqueOrThrow({ where: { wholesaleOrderId } });
      return {
        orderId: record.orderId,
        supplierId: row.supplierId.toString(),
        grossAmount: row.grossAmount.toNumber(),
        commissionRate: row.commissionRate.toNumber(),
        commissionAmount: row.commissionAmount.toNumber(),
        invoice: toInvoice(record.orderId, serviceInvoice),
      };
    });
  }
}
