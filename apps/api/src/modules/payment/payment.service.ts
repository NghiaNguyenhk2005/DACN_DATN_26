import { Injectable } from "@nestjs/common";
import { Clock } from "../../core/clock";
import { PaymentGateway, type ChargeResult } from "../../integrations/payment-gateway";
import { PaymentRepository, type PaymentRecord } from "./payment.repository";

// Giao dịch thanh toán của đơn. Cổng gọi qua PaymentGateway (prototype: giả lập luôn thành công); COD không qua cổng.
@Injectable()
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly clock: Clock,
  ) {}

  async charge(orderId: string, amount: number): Promise<ChargeResult> {
    const result = await this.gateway.charge(orderId, amount);
    await this.save({
      orderId,
      method: "prepaid",
      amount,
      status: result.status === "succeeded" ? "succeeded" : "failed",
      reference: result.reference,
    });
    return result;
  }

  /** Đơn COD hợp lệ: ghi nhận xác nhận, tiền thu khi giao. */
  confirmCod(orderId: string, amount: number): Promise<void> {
    return this.save({ orderId, method: "cod", amount, status: "cod_confirmed", reference: null });
  }

  /** Hủy đơn đã thanh toán trước: đánh dấu hoàn tiền (prototype không gọi cổng). */
  async refund(orderId: string): Promise<void> {
    const record = await this.repo.findByOrderId(orderId);
    if (record && record.status === "succeeded") await this.repo.save({ ...record, status: "refunded" });
  }

  findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    return this.repo.findByOrderId(orderId);
  }

  private save(partial: Omit<PaymentRecord, "createdAt">): Promise<void> {
    return this.repo.save({ ...partial, createdAt: this.clock.now().toISOString() });
  }
}
