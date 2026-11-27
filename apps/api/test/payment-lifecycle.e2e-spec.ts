import { randomInt } from "node:crypto";
import { performance } from "node:perf_hooks";
import { Test, type TestingModule } from "@nestjs/testing";
import { SystemClock } from "../src/core/clock";
import { DemoResetRegistry } from "../src/core/demo-reset.registry";
import type { EventBus } from "../src/core/events/event-bus";
import { PRISMA_CLIENT, type PrismaClient } from "../src/core/prisma";
import { IntegrationsModule } from "../src/integrations/integrations.module";
import { DemoPaymentGateway } from "../src/integrations/payment-gateway";
import { InMemoryPaymentRepository } from "../src/modules/payment/in-memory-payment.repository";
import { PaymentModule } from "../src/modules/payment/payment.module";
import { PaymentService } from "../src/modules/payment/payment.service";

function fixture() {
  const repository = new InMemoryPaymentRepository(new DemoResetRegistry());
  const gateway = new DemoPaymentGateway();
  const publish = jest.fn();
  const service = new PaymentService(repository, gateway, new SystemClock(), { publish } as unknown as EventBus);
  return { service, repository, gateway, publish };
}

describe("Vòng đời thanh toán giả lập", () => {
  afterEach(() => { jest.useRealTimers(); });

  it("ghi nhận từ chối và hết hạn, sau đó cho phép thử lại và ghi thành công một lần", async () => {
    const { service, gateway, publish } = fixture();
    const charge = jest.spyOn(gateway, "charge");
    await expect(service.charge("41", 1000, { status: "failed" })).resolves.toMatchObject({ status: "failed" });
    await expect(service.findByOrderId("41")).resolves.toMatchObject({ status: "failed" });
    await expect(service.charge("41", 1000, { status: "expired" })).resolves.toMatchObject({ status: "expired" });
    await expect(service.findByOrderId("41")).resolves.toMatchObject({ status: "expired" });
    const results = await Promise.all([service.charge("41", 1000), service.charge("41", 1000)]);
    expect(results).toEqual([
      { status: "succeeded", reference: "demo-41" },
      { status: "succeeded", reference: "demo-41" },
    ]);
    expect(charge).toHaveBeenCalledTimes(3);
    expect(publish.mock.calls).toEqual([["PaymentSucceeded", { orderId: "41", amount: 1000, reference: "demo-41" }]]);
    await expect(service.charge("41", 1200)).rejects.toMatchObject({ code: "PAYMENT_AMOUNT_CHANGED" });
  });

  it("nhận kết quả ở 4999 ms và không gọi lại", async () => {
    jest.useFakeTimers({ now: 0 });
    const { service, gateway } = fixture();
    const charge = jest.spyOn(gateway, "charge");
    const result = service.charge("41", 1000, { delayMs: 4_999 });
    await jest.advanceTimersByTimeAsync(4_999);
    await expect(result).resolves.toMatchObject({ status: "succeeded" });
    expect(charge).toHaveBeenCalledTimes(1);
    expect(Date.now()).toBe(4_999);
  });

  it("hủy từng lượt ở 5000 ms, thử lại sau 250 và 500 ms rồi dừng", async () => {
    jest.useFakeTimers({ now: 0 });
    const { service, gateway, publish } = fixture();
    const callTimes: number[] = [];
    const abortTimes: number[] = [];
    const charge = gateway.charge.bind(gateway);
    jest.spyOn(gateway, "charge").mockImplementation((orderId, amount, scenario, signal) => {
      callTimes.push(Date.now());
      signal?.addEventListener("abort", () => abortTimes.push(Date.now()), { once: true });
      return charge(orderId, amount, scenario, signal);
    });
    const result = service.charge("41", 1000, { delayMs: 5_001 });
    await jest.advanceTimersByTimeAsync(15_750);
    await expect(result).resolves.toEqual({ status: "expired", reference: null });
    expect(callTimes).toEqual([0, 5_250, 10_750]);
    expect(abortTimes).toEqual([5_000, 10_250, 15_750]);
    expect(jest.getTimerCount()).toBe(0);
    expect(publish).not.toHaveBeenCalled();
    await expect(service.findByOrderId("41")).resolves.toBeNull();
  });

  it.each([undefined, "81"])("hoàn tiền qua cổng một lần với mã khiếu nại %s", async (returnRequestId) => {
    const { service, gateway, publish } = fixture();
    const refund = jest.spyOn(gateway, "refund");
    await service.charge("41", 1000);
    await Promise.all([
      service.refund("41", { requestedBy: "2", returnRequestId }),
      service.refund("41", { requestedBy: "2", returnRequestId }),
    ]);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(refund).toHaveBeenCalledWith(
      { idempotencyKey: "41", paymentReference: "demo-41", amount: 1000 },
      expect.any(AbortSignal),
    );
    await expect(service.findByOrderId("41")).resolves.toMatchObject({ status: "refunded", amount: 1000 });
    expect(publish.mock.calls.filter(([name]) => name === "Refunded")).toEqual([["Refunded", { orderId: "41", amount: 1000 }]]);
  });

  it("chỉ hoàn COD đã thu khi xử lý khiếu nại", async () => {
    const { service, gateway } = fixture();
    const refund = jest.spyOn(gateway, "refund");
    await service.confirmCod("41", 1000);
    await service.refund("41", { requestedBy: "2" });
    expect(refund).not.toHaveBeenCalled();
    await service.refund("41", { requestedBy: "2", returnRequestId: "81", allowCollectedCod: true });
    expect(refund).toHaveBeenCalledWith(
      { idempotencyKey: "41", paymentReference: "demo-cod-41", amount: 1000 },
      expect.any(AbortSignal),
    );
    await expect(service.findByOrderId("41")).resolves.toMatchObject({ status: "refunded", method: "cod", amount: 1000 });
  });

  it("giữ hóa đơn và biểu phí đã chốt dù gọi lại với dữ liệu thay đổi", async () => {
    const { service } = fixture();
    await service.confirmCod("41", 1050);
    const invoice = await service.issueRetailInvoice("41", "Khách kiểm thử", 1050, 50);
    expect(invoice).toMatchObject({ total: 1050, subtotal: 1000, taxAmount: 50, lookupCode: "DEMO-INVOICE-41" });
    await expect(service.issueRetailInvoice("41", "Tên khác", 2000)).resolves.toEqual(invoice);
    await expect(service.findInvoice("41")).resolves.toEqual(invoice);
    const settlement = await service.settleWholesale("WS-ORDER-41", "2", 1_000.09, 0.0735, "Nhà cung cấp kiểm thử");
    expect(settlement).toMatchObject({
      commissionRate: 0.0735,
      commissionAmount: 73.51,
      invoice: { buyerName: "Nhà cung cấp kiểm thử", total: 73.51 },
    });
    await expect(service.settleWholesale("WS-ORDER-41", "2", 1_000.09, 0.13)).resolves.toEqual(settlement);
  });
});

const measureRealClock = process.env.PAYMENT_REAL_CLOCK === "1" ? it : it.skip;
measureRealClock("đo NFR7.1 trên đồng hồ monotonic", async () => {
  async function measure(delayMs: number) {
    const { service, gateway } = fixture();
    const callTimes: number[] = [];
    const abortTimes: number[] = [];
    const charge = gateway.charge.bind(gateway);
    const start = performance.now();
    jest.spyOn(gateway, "charge").mockImplementation((orderId, amount, scenario, signal) => {
      callTimes.push(performance.now() - start);
      signal?.addEventListener("abort", () => abortTimes.push(performance.now() - start), { once: true });
      return charge(orderId, amount, scenario, signal);
    });
    const result = await service.charge("41", 1000, { delayMs });
    return {
      delayMs,
      status: result.status,
      calls: callTimes.length,
      elapsedMs: Math.round(performance.now() - start),
      attemptMs: abortTimes.map((time, index) => Math.round(time - callTimes[index]!)),
      backoffMs: callTimes.slice(1).map((time, index) => Math.round(time - abortTimes[index]!)),
    };
  }

  const under = await measure(4_500);
  const over = await measure(5_250);
  console.info(JSON.stringify({ paymentGatewayTimeout: [under, over] }));
  expect(under).toMatchObject({ status: "succeeded", calls: 1 });
  expect(over).toMatchObject({ status: "expired", calls: 3 });
  expect(over.attemptMs).toHaveLength(3);
  expect(over.backoffMs).toHaveLength(2);
}, 30_000);

const describePg = process.env.STORAGE === "prisma" ? describe : describe.skip;
describePg("Dữ liệu thanh toán qua lần khởi động mới", () => {
  const open = () => Test.createTestingModule({ imports: [PaymentModule, IntegrationsModule] }).compile();

  it("giữ giao dịch đã hoàn toàn bộ và hóa đơn sau khi đóng module", async () => {
    const id = randomInt(10_000_000, 100_000_000).toString();
    let module: TestingModule = await open();
    try {
      const service = module.get(PaymentService);
      await service.charge(id, 1000);
      await service.refund(id, { requestedBy: "2", returnRequestId: "51" });
      await service.issueRetailInvoice(id, "Khách kiểm thử", 1000, 50);
      await module.close();
      module = await open();

      const reopened = module.get(PaymentService);
      await expect(reopened.findByOrderId(id)).resolves.toMatchObject({ status: "refunded", amount: 1000 });
      await expect(reopened.findInvoice(id)).resolves.toMatchObject({ total: 1000, taxAmount: 50 });
      await reopened.refund(id, { requestedBy: "4" });
      const prisma = module.get<PrismaClient>(PRISMA_CLIENT);
      const payment = await prisma.payment.findUniqueOrThrow({
        where: { sourceType_sourceId: { sourceType: "retail_order", sourceId: BigInt(id) } },
        include: { refunds: true },
      });
      expect(payment.refunds).toHaveLength(1);
      expect(payment.refunds[0]).toMatchObject({ gatewayRefundRef: `demo-refund-${id}`, requestedBy: 2n, returnRequestId: 51n });
      expect(payment.refunds[0]?.amount.toNumber()).toBe(1000);
    } finally {
      const prisma = module.get<PrismaClient>(PRISMA_CLIENT);
      const source = { sourceType: "retail_order", sourceId: BigInt(id) };
      try {
        await prisma.$transaction([
          prisma.refund.deleteMany({ where: { payment: source } }),
          prisma.payment.deleteMany({ where: source }),
          prisma.invoice.deleteMany({ where: source }),
        ]);
      } finally {
        await module.close();
      }
    }
  });
});
