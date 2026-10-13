import { Injectable } from "@nestjs/common";

export interface ChargeResult {
  status: "succeeded" | "failed";
  reference: string;
}

// Cổng thanh toán. Prototype thanh toán giả lập; MVP gắn môi trường thử nghiệm của cổng thật, kết quả về qua webhook.
export abstract class PaymentGateway {
  abstract charge(orderId: string, amount: number): Promise<ChargeResult>;
}

@Injectable()
export class DemoPaymentGateway extends PaymentGateway {
  async charge(orderId: string): Promise<ChargeResult> {
    return { status: "succeeded", reference: `demo-${orderId}` };
  }
}
