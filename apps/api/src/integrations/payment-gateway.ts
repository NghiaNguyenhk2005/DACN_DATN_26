import { Injectable } from "@nestjs/common";

export interface ChargeResult {
  status: "succeeded" | "failed" | "expired";
  reference: string | null;
}

export interface DemoPaymentScenario {
  status?: ChargeResult["status"];
  delayMs?: number;
}

export interface RefundRequest {
  paymentReference: string;
  amount: number;
  idempotencyKey: string;
}

export class PaymentGatewayTimeout extends Error {
  constructor() {
    super("Cổng thanh toán không phản hồi trong 5 giây");
  }
}

export const PAYMENT_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [250, 500];

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    function abort() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function callPaymentGateway<T>(call: (signal: AbortSignal) => Promise<T>): Promise<T> {
  for (const retryDelay of [...RETRY_DELAYS_MS, null]) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new PaymentGatewayTimeout());
          controller.abort();
        }, PAYMENT_TIMEOUT_MS);
      });
      return await Promise.race([deadline, call(controller.signal)]);
    } catch (error) {
      if (!(error instanceof PaymentGatewayTimeout) || retryDelay === null) throw error;
    } finally {
      clearTimeout(timer);
    }
    await delay(retryDelay);
  }
  throw new PaymentGatewayTimeout();
}

export abstract class PaymentGateway {
  /** Dùng orderId làm khóa chống trùng cho lần thử lại của cùng giao dịch. */
  abstract charge(orderId: string, amount: number, scenario?: DemoPaymentScenario, signal?: AbortSignal): Promise<ChargeResult>;
  abstract refund(request: RefundRequest, signal?: AbortSignal): Promise<ChargeResult>;
}

@Injectable()
export class DemoPaymentGateway extends PaymentGateway {
  async charge(orderId: string, _amount: number, scenario?: DemoPaymentScenario, signal?: AbortSignal): Promise<ChargeResult> {
    await this.wait(scenario, signal);
    const status = scenario?.status ?? "succeeded";
    return { status, reference: status === "succeeded" ? `demo-${orderId}` : null };
  }

  async refund(request: RefundRequest, signal?: AbortSignal): Promise<ChargeResult> {
    signal?.throwIfAborted();
    return { status: "succeeded", reference: `demo-refund-${request.idempotencyKey}` };
  }

  private async wait(scenario?: DemoPaymentScenario, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    if (scenario?.delayMs) await delay(scenario.delayMs, signal);
  }
}
