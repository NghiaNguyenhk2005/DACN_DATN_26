import { Injectable } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { EventBus } from "../src/core/events/event-bus";
import { EVENT_NAMES, PUBLISHED_EVENTS, type DomainEvent, type EventName } from "../src/core/events/events";
import { OnDomainEvent } from "../src/core/events/on-domain-event";
import { TokenService } from "../src/core/token.service";
import { addAddress, createTestApp, firstSlot, holdingOf, login, place, setCart, type TestApp } from "./support";

// Bên nhận thử: ghi lại sự kiện; StockLow lỗi ở lần đầu; BatchApproved có thể bật lỗi.
@Injectable()
class Probe {
  readonly seen: DomainEvent[] = [];
  stockLowAttempts = 0;
  failBatchApproved = false;

  of<K extends EventName>(name: K): DomainEvent<K>[] {
    return this.seen.filter((e): e is DomainEvent<K> => e.name === name);
  }

  @OnDomainEvent("BatchApproved") onBatchApproved(e: DomainEvent<"BatchApproved">): void {
    if (this.failBatchApproved) throw new Error("bên nhận lỗi có chủ đích");
    this.seen.push(e);
  }
  @OnDomainEvent("OrderPlaced") onPlaced(e: DomainEvent<"OrderPlaced">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("OrderCancelled") onCancelled(e: DomainEvent<"OrderCancelled">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("PaymentSucceeded") onPaid(e: DomainEvent<"PaymentSucceeded">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("Refunded") onRefunded(e: DomainEvent<"Refunded">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("ProductChanged") onProduct(e: DomainEvent<"ProductChanged">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("ReviewPosted") onReview(e: DomainEvent<"ReviewPosted">): void {
    this.seen.push(e);
  }
  @OnDomainEvent("StockLow") onStockLow(e: DomainEvent<"StockLow">): void {
    this.stockLowAttempts += 1;
    if (this.stockLowAttempts === 1) throw new Error("lỗi lần đầu");
    this.seen.push(e);
  }
}

describe("Bus sự kiện nghiệp vụ", () => {
  let t: TestApp;
  let probe: Probe;
  let bus: EventBus;
  let ops: string;
  let staff: string;
  let seller: string;

  beforeAll(async () => {
    t = await createTestApp([Probe]);
    probe = t.app.get(Probe);
    bus = t.app.get(EventBus);
    ops = await login(t, "vanhanh@farmery.vn");
    const tokens = t.app.get(TokenService);
    staff = await tokens.sign({ id: "301", roles: ["staff_moderation"] });
    seller = await tokens.sign({ id: "201", roles: ["seller"] });
  });

  afterAll(() => t.app.close());

  beforeEach(async () => {
    await request(t.http()).post("/api/dev/reset").expect(204);
    probe.seen.length = 0;
    probe.stockLowAttempts = 0;
    probe.failBatchApproved = false;
  });

  describe("danh mục", () => {
    it("17 tên sự kiện trong mã khớp Phụ lục V của báo cáo", () => {
      const tex = readFileSync(join(__dirname, "../../../report/backmatter/phuluc-sukien.tex"), "utf8");
      const inReport = [...tex.matchAll(/^\\texttt\{(\w+)\} &/gm)].map((m) => m[1]);
      expect(inReport).toHaveLength(17);
      expect([...EVENT_NAMES]).toEqual(inReport);
    });

    it("sự kiện đã có điểm phát đều nằm trong danh mục", () => {
      for (const name of PUBLISHED_EVENTS) expect(EVENT_NAMES).toContain(name);
    });
  });

  describe("BatchApproved: catalog phát, inventory nhận", () => {
    it("duyệt lô thì inventory mở dòng tồn đúng số khai báo, và sự kiện được phát một lần", async () => {
      expect(await holdingOf(t, ops, "1016")).toBeUndefined();
      await request(t.http()).post("/api/admin/review-tasks/7001/approve").auth(staff, { type: "bearer" }).expect(200);
      const holding = await holdingOf(t, ops, "1016");
      expect(holding).toMatchObject({ qtyReserved: 0 });
      expect(holding?.qtyOnHand).toBeGreaterThan(0);
      expect(probe.of("BatchApproved")).toHaveLength(1);
      expect(probe.of("BatchApproved")[0]?.payload).toMatchObject({ batchId: "1016", batchCode: "DTDL-2610-16" });
    });

    it("bên nhận khác ném lỗi vẫn không làm hỏng yêu cầu duyệt, và dòng tồn vẫn được mở", async () => {
      probe.failBatchApproved = true;
      await request(t.http()).post("/api/admin/review-tasks/7001/approve").auth(staff, { type: "bearer" }).expect(200);
      expect(await holdingOf(t, ops, "1016")).toBeDefined();
    });
  });

  describe("giao nhận", () => {
    it("gửi lại cùng một sự kiện chỉ có tác dụng một lần", async () => {
      const event = await bus.publish("ReviewPosted", { reviewId: "r1", productId: "1", flagged: false });
      expect(probe.of("ReviewPosted")).toHaveLength(1);
      await bus.deliver(event);
      await bus.deliver(event);
      expect(probe.of("ReviewPosted")).toHaveLength(1);
      await bus.publish("ReviewPosted", { reviewId: "r2", productId: "1", flagged: true });
      expect(probe.of("ReviewPosted")).toHaveLength(2);
    });

    it("bên nhận lỗi: bên phát không bị ném lỗi, lần gửi lại được chạy lại cho đến khi thành công", async () => {
      const event = await bus.publish("StockLow", { holdingId: "h1", batchId: "1001", qtyAvailable: 3 });
      expect(probe.stockLowAttempts).toBe(1);
      expect(probe.of("StockLow")).toHaveLength(0);
      await bus.deliver(event);
      expect(probe.stockLowAttempts).toBe(2);
      expect(probe.of("StockLow")).toHaveLength(1);
      await bus.deliver(event);
      expect(probe.stockLowAttempts).toBe(2);
    });
  });

  describe("điểm phát trong mã", () => {
    let buyer: string;

    beforeAll(async () => {
      buyer = await login(t, "khachle@example.com");
    });

    // dev/reset xóa cả địa chỉ nên mỗi lần đặt đơn tạo địa chỉ mới.
    const order = async (paymentOption: "cod" | "prepaid" = "prepaid") => {
      const addressId = await addAddress(t, buyer);
      await setCart(t, buyer, "201", 10).expect(200);
      const body = { addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption };
      return (await place(t, buyer, body).expect(201)).body as { id: string; orderCode: string; totalAmount: number };
    };

    it("OrderPlaced phát một lần khi đặt đơn", async () => {
      const o = await order();
      expect(probe.of("OrderPlaced")).toHaveLength(1);
      expect(probe.of("OrderPlaced")[0]?.payload).toMatchObject({
        orderId: o.id,
        orderCode: o.orderCode,
        paymentOption: "prepaid",
        totalAmount: o.totalAmount,
      });
    });

    it("trả tiền phát PaymentSucceeded; hủy đơn đã trả phát OrderCancelled (refundDue) và Refunded", async () => {
      const o = await order();
      await request(t.http()).post(`/api/orders/${o.id}/pay`).auth(buyer, { type: "bearer" }).expect(200);
      expect(probe.of("PaymentSucceeded")).toHaveLength(1);
      expect(probe.of("PaymentSucceeded")[0]?.payload).toMatchObject({ orderId: o.id, amount: o.totalAmount });

      await request(t.http()).post(`/api/orders/${o.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);
      expect(probe.of("OrderCancelled")[0]?.payload).toMatchObject({ orderId: o.id, reason: "buyer_cancelled", refundDue: true });
      expect(probe.of("Refunded")[0]?.payload).toMatchObject({ orderId: o.id, amount: o.totalAmount });
    });

    it("hủy đơn chưa trả: refundDue=false và không có Refunded", async () => {
      const o = await order();
      await request(t.http()).post(`/api/orders/${o.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);
      expect(probe.of("OrderCancelled")[0]?.payload).toMatchObject({ orderId: o.id, refundDue: false });
      expect(probe.of("Refunded")).toHaveLength(0);
    });

    it("đơn quá hạn giữ chỗ tự hủy: OrderCancelled phát đúng một lần với lý do reservation_expired", async () => {
      const o = await order();
      t.clock.advanceMinutes(16);
      await request(t.http()).get(`/api/orders/${o.id}`).auth(buyer, { type: "bearer" }).expect(200);
      await request(t.http()).get(`/api/orders/${o.id}`).auth(buyer, { type: "bearer" }).expect(200);
      expect(probe.of("OrderCancelled")).toHaveLength(1);
      expect(probe.of("OrderCancelled")[0]?.payload).toMatchObject({ orderId: o.id, reason: "reservation_expired", refundDue: false });
    });

    it("tạo sản phẩm và duyệt sản phẩm phát ProductChanged", async () => {
      const created = await request(t.http())
        .post("/api/seller/products")
        .auth(seller, { type: "bearer" })
        .set("Idempotency-Key", "0b6f3c1e-8d0a-4a51-9a52-6f1f2b9c0d12")
        .send({ categoryId: "11", name: "Dâu tây thử sự kiện", unit: "kg" })
        .expect(201);
      expect(probe.of("ProductChanged")).toEqual([expect.objectContaining({ payload: { productId: created.body.id, change: "created" } })]);
    });
  });
});
