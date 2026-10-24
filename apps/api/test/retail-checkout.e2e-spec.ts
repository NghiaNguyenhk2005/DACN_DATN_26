import { randomUUID } from "node:crypto";
import request from "supertest";
import { addAddress, createTestApp, firstSlot, holdingOf, login, place, setCart, type TestApp } from "./support";

// Tin bán mẫu: L201 dâu tây Hana 125.000đ/hộp (lô 1001, tồn 150); L227 220.000đ/hộp (lô 1014, tồn 90).
const L201 = "201";
const L227 = "227";

describe("Giỏ hàng, tính tiền, đặt đơn giữ chỗ 15 phút", () => {
  let t: TestApp;
  let buyer: string;
  let ops: string;
  let addressId: string;

  beforeEach(async () => {
    t = await createTestApp();
    buyer = await login(t, "khachle@example.com");
    ops = await login(t, "vanhanh@farmery.vn");
    addressId = await addAddress(t, buyer);
  });
  afterEach(() => t.app.close());

  const body = async (paymentOption: "cod" | "prepaid") => ({ addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption });

  describe("giỏ hàng", () => {
    it("thêm, đổi, xóa và cộng tiền; vượt tồn trả 422 CART_QTY_EXCEEDS_STOCK; tin bán lạ trả 404", async () => {
      await setCart(t, buyer, L201, 2).expect(200);
      const cart = await setCart(t, buyer, L227, 1).expect(200);
      expect(cart.body.subtotal).toBe(2 * 125000 + 220000);
      expect(cart.body.items[0]).toMatchObject({ listingId: L201, quantity: 2, available: 150, lineTotal: 250000 });

      const over = await setCart(t, buyer, L201, 151).expect(422);
      expect(over.body.code).toBe("CART_QTY_EXCEEDS_STOCK");
      await setCart(t, buyer, "99999", 1).expect(404);
      await setCart(t, buyer, L201, 0).expect(400); // quantity > 0 do hợp đồng chặn

      const after = await request(t.http()).delete(`/api/cart/items/${L201}`).auth(buyer, { type: "bearer" }).expect(200);
      expect(after.body.items.map((i: { listingId: string }) => i.listingId)).toEqual([L227]);
    });

    it("giỏ của mỗi người tách nhau và chỉ khách lẻ được dùng", async () => {
      await setCart(t, buyer, L201, 1).expect(200);
      const other = await login(t, "khachtuchoi@example.com");
      expect((await request(t.http()).get("/api/cart").auth(other, { type: "bearer" }).expect(200)).body.items).toEqual([]);
      await request(t.http()).get("/api/cart").auth(ops, { type: "bearer" }).expect(403);
    });
  });

  describe("tính tiền (quote)", () => {
    it("thuế GTGT 5% đã gồm trong giá, cước 25.000đ dưới 300.000đ", async () => {
      await setCart(t, buyer, L201, 2).expect(200);
      const q = await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(200);
      expect(q.body).toMatchObject({ subtotal: 250000, taxAmount: 11905, shippingFee: 25000, totalAmount: 275000, codAllowed: true, codReason: null });
    });

    it("miễn cước từ 300.000đ", async () => {
      await setCart(t, buyer, L201, 3).expect(200);
      const q = await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(200);
      expect(q.body).toMatchObject({ subtotal: 375000, shippingFee: 0, totalAmount: 375000 });
    });

    it("COD đóng khi tổng vượt 1.000.000đ hoặc tài khoản từng từ chối nhận hàng", async () => {
      await setCart(t, buyer, L227, 5).expect(200); // 1.100.000đ
      const big = await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(200);
      expect(big.body.codAllowed).toBe(false);
      expect(big.body.codReason).toMatch(/vượt mức/);

      const refuser = await login(t, "khachtuchoi@example.com");
      const addr = await addAddress(t, refuser);
      await setCart(t, refuser, L201, 1).expect(200);
      const q = await request(t.http()).post("/api/checkout/quote").auth(refuser, { type: "bearer" }).send({ addressId: addr }).expect(200);
      expect(q.body).toMatchObject({ codAllowed: false, codReason: "Tài khoản từng từ chối nhận hàng COD" });
    });

    it("khung giờ: ba ngày × ba khung; sau giờ chốt 16:00 hôm nay hết nhận, ngày mai vẫn còn", async () => {
      await setCart(t, buyer, L201, 1).expect(200);
      const ask = () => request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(200);

      const before = (await ask()).body.deliverySlots as { date: string; slot: string; available: boolean }[];
      expect(before).toHaveLength(9);
      expect(before.filter((s) => s.available)).toHaveLength(9);
      expect(before[0]).toEqual({ date: "2026-10-21", slot: "08:00-11:00", available: true });

      t.clock.set("2026-10-21T10:00:00Z"); // 17:00 giờ Việt Nam
      const after = (await ask()).body.deliverySlots as { date: string; available: boolean }[];
      expect(after.filter((s) => s.date === "2026-10-21").every((s) => !s.available)).toBe(true);
      expect(after.filter((s) => s.date === "2026-10-22").every((s) => s.available)).toBe(true);
    });

    it("giỏ rỗng trả 422 CART_EMPTY, địa chỉ của người khác trả 422 ADDRESS_NOT_FOUND", async () => {
      const empty = await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(422);
      expect(empty.body.code).toBe("CART_EMPTY");
      await setCart(t, buyer, L201, 1).expect(200);
      const stranger = await login(t, "khachtuchoi@example.com");
      const strangerAddr = await addAddress(t, stranger);
      const res = await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId: strangerAddr }).expect(422);
      expect(res.body.code).toBe("ADDRESS_NOT_FOUND");
    });
  });

  describe("đặt đơn và giữ chỗ", () => {
    it("đơn trả trước: placed, giữ chỗ đúng 15 phút, tồn khả dụng giảm, giỏ rỗng", async () => {
      await setCart(t, buyer, L201, 10).expect(200);
      const res = await place(t, buyer, await body("prepaid")).expect(201);
      expect(res.body).toMatchObject({ status: "placed", paymentOption: "prepaid", subtotal: 1250000, shippingFee: 0, cancellable: true });
      expect(res.body.orderCode).toMatch(/^FM-261021-0001$/);
      expect(res.body.reserveExpiresAt).toBe("2026-10-21T03:15:00.000Z");
      expect(res.body.items).toEqual([expect.objectContaining({ batchCode: "DTDL-2610-01", traceCode: "TRC-DTDL-2610-01", quantity: 10, lineTotal: 1250000 })]);
      expect(res.body.timeline).toEqual([expect.objectContaining({ toStatus: "placed", source: "system" })]);

      expect((await request(t.http()).get("/api/cart").auth(buyer, { type: "bearer" })).body.items).toEqual([]);
      const product = await request(t.http()).get("/api/products/1").expect(200);
      expect(product.body.listing.available).toBe(140);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 10 });
    });

    it("quá 15 phút chưa trả thì tự hủy, nhả tồn, và thanh toán muộn trả 409 RESERVATION_EXPIRED", async () => {
      await setCart(t, buyer, L201, 10).expect(200);
      const order = (await place(t, buyer, await body("prepaid")).expect(201)).body;

      t.clock.advanceMinutes(14);
      expect((await request(t.http()).get(`/api/orders/${order.id}`).auth(buyer, { type: "bearer" }).expect(200)).body.status).toBe("placed");

      t.clock.advanceMinutes(2);
      const late = await request(t.http()).post(`/api/orders/${order.id}/pay`).auth(buyer, { type: "bearer" }).expect(409);
      expect(late.body.code).toBe("RESERVATION_EXPIRED");

      const cancelled = (await request(t.http()).get(`/api/orders/${order.id}`).auth(buyer, { type: "bearer" }).expect(200)).body;
      expect(cancelled).toMatchObject({ status: "cancelled", reserveExpiresAt: null, cancellable: false });
      expect(cancelled.timeline.at(-1)).toMatchObject({ toStatus: "cancelled", source: "system" });
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 0 });
      expect((await request(t.http()).get("/api/products/1").expect(200)).body.listing.available).toBe(150);
    });

    it("thanh toán trong hạn: paid, giữ chỗ chuyển thành trừ tồn; trả lần hai trả 409 ORDER_NOT_PAYABLE", async () => {
      await setCart(t, buyer, L201, 10).expect(200);
      const order = (await place(t, buyer, await body("prepaid")).expect(201)).body;
      const paid = await request(t.http()).post(`/api/orders/${order.id}/pay`).auth(buyer, { type: "bearer" }).expect(200);
      expect(paid.body).toMatchObject({ status: "paid", reserveExpiresAt: null });
      expect(paid.body.timeline.at(-1)).toMatchObject({ toStatus: "paid", source: "payment_webhook" });
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 140, qtyReserved: 0 });

      const again = await request(t.http()).post(`/api/orders/${order.id}/pay`).auth(buyer, { type: "bearer" }).expect(409);
      expect(again.body.code).toBe("ORDER_NOT_PAYABLE");
      t.clock.advanceMinutes(60); // đã trả thì không bị tự hủy nữa
      expect((await request(t.http()).get(`/api/orders/${order.id}`).auth(buyer, { type: "bearer" })).body.status).toBe("paid");
    });

    it("COD hợp lệ sang paid ngay và trừ tồn; COD vượt ngưỡng trả 422 COD_NOT_ALLOWED", async () => {
      await setCart(t, buyer, L201, 2).expect(200);
      const cod = await place(t, buyer, await body("cod")).expect(201);
      expect(cod.body).toMatchObject({ status: "paid", reserveExpiresAt: null, totalAmount: 275000 });
      expect(cod.body.timeline.map((e: { toStatus: string }) => e.toStatus)).toEqual(["placed", "paid"]);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 148, qtyReserved: 0 });
      await request(t.http()).post(`/api/orders/${cod.body.id}/pay`).auth(buyer, { type: "bearer" }).expect(409);

      await setCart(t, buyer, L227, 5).expect(200);
      const bad = await place(t, buyer, await body("cod")).expect(422);
      expect(bad.body.code).toBe("COD_NOT_ALLOWED");
      expect(await holdingOf(t, ops, "1014")).toMatchObject({ qtyReserved: 0 }); // không giữ chỗ khi bị từ chối
    });

    it("khung giờ ngoài báo giá hoặc đã qua giờ chốt trả 422 SLOT_UNAVAILABLE", async () => {
      await setCart(t, buyer, L201, 1).expect(200);
      const odd = await place(t, buyer, { addressId, deliveryDate: "2026-10-21", deliverySlot: "01:00-02:00", paymentOption: "cod" }).expect(422);
      expect(odd.body.code).toBe("SLOT_UNAVAILABLE");
      t.clock.set("2026-10-21T10:00:00Z");
      const late = await place(t, buyer, { addressId, deliveryDate: "2026-10-21", deliverySlot: "08:00-11:00", paymentOption: "cod" }).expect(422);
      expect(late.body.code).toBe("SLOT_UNAVAILABLE");
    });

    it("đặt thiếu Idempotency-Key bị chặn; gửi lại cùng key trả lại đúng đơn cũ, không giữ chỗ hai lần", async () => {
      await setCart(t, buyer, L201, 5).expect(200);
      const payload = await body("prepaid");
      await request(t.http()).post("/api/orders").auth(buyer, { type: "bearer" }).send(payload).expect(400);
      const key = randomUUID();
      const first = await place(t, buyer, payload, key).expect(201);
      const again = await place(t, buyer, payload, key).expect(201);
      expect(again.body.id).toBe(first.body.id);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyReserved: 5 });
    });

    it("hai khách tranh nhau phần hàng cuối: một người được, người kia 409 STOCK_CONFLICT, không bán vượt", async () => {
      const rival = await login(t, "khachtuchoi@example.com");
      const rivalAddr = await addAddress(t, rival);
      // L227 còn 90: mỗi người đặt 60, chỉ một đơn được giữ chỗ.
      await setCart(t, buyer, L227, 60).expect(200);
      await setCart(t, rival, L227, 60).expect(200);
      const [a, b] = await Promise.all([
        place(t, buyer, await body("prepaid")),
        place(t, rival, { addressId: rivalAddr, ...(await firstSlot(t, rival, rivalAddr)), paymentOption: "prepaid" }),
      ]);
      expect([a.status, b.status].sort()).toEqual([201, 409]);
      const failed = a.status === 409 ? a : b;
      expect(failed.body.code).toBe("STOCK_CONFLICT");
      expect(await holdingOf(t, ops, "1014")).toMatchObject({ qtyOnHand: 90, qtyReserved: 60 });
    });
  });

  describe("FEFO", () => {
    it("lấy lô hết hạn trước và tách thành nhiều dòng khi một lô không đủ (lô mới duyệt có hàng để bán)", async () => {
      // Lô 1016 (dâu Hana, hạn 24/10, khai báo 150) đang chờ duyệt: duyệt xong thì mở thêm dòng tồn.
      const mod = await login(t, "staff@example.com");
      const tasks = await request(t.http()).get("/api/admin/review-tasks?type=batch").auth(mod, { type: "bearer" }).expect(200);
      const task = tasks.body.items.find((x: { targetId: string }) => x.targetId === "1016");
      await request(t.http()).post(`/api/admin/review-tasks/${task.id}/approve`).auth(mod, { type: "bearer" }).expect(200);
      expect(await holdingOf(t, ops, "1016")).toMatchObject({ qtyOnHand: 150, qtyReserved: 0 });
      expect((await request(t.http()).get("/api/products/1").expect(200)).body.listing.available).toBe(300);

      await setCart(t, buyer, L201, 160).expect(200);
      const order = (await place(t, buyer, await body("prepaid")).expect(201)).body;
      expect(order.items).toHaveLength(2);
      expect(order.items[0]).toMatchObject({ batchCode: "DTDL-2610-01", quantity: 150 }); // hết hạn 21/10 → lấy trước
      expect(order.items[1]).toMatchObject({ quantity: 10 }); // phần còn lại từ lô duyệt sau
      expect(order.items[1].batchCode).not.toBe("DTDL-2610-01");
      expect(order.items[1].traceCode).toMatch(/^TRC-/);
      const sum = order.items.reduce((s: number, i: { lineTotal: number }) => s + i.lineTotal, 0);
      expect(sum).toBe(160 * 125000); // tiền các dòng tách khớp tiền dòng giỏ
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 150 });
      expect(await holdingOf(t, ops, "1016")).toMatchObject({ qtyOnHand: 150, qtyReserved: 10 });
    });
  });

  describe("hủy đơn", () => {
    it("hủy khi placed nhả giữ chỗ; hủy khi paid hoàn tồn; sau đóng gói không hủy được", async () => {
      await setCart(t, buyer, L201, 4).expect(200);
      const a = (await place(t, buyer, await body("prepaid")).expect(201)).body;
      const cancelA = await request(t.http()).post(`/api/orders/${a.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);
      expect(cancelA.body).toMatchObject({ status: "cancelled", cancellable: false });
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 0 });
      expect((await request(t.http()).post(`/api/orders/${a.id}/cancel`).auth(buyer, { type: "bearer" }).expect(409)).body.code).toBe("ORDER_NOT_CANCELLABLE");

      await setCart(t, buyer, L201, 4).expect(200);
      const b = (await place(t, buyer, await body("cod")).expect(201)).body; // paid ngay
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 146 });
      await request(t.http()).post(`/api/orders/${b.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 0 });

      await setCart(t, buyer, L201, 1).expect(200);
      const c = (await place(t, buyer, await body("cod")).expect(201)).body;
      await request(t.http()).post(`/api/admin/orders/${c.id}/advance`).auth(ops, { type: "bearer" }).expect(200); // packing
      expect((await request(t.http()).post(`/api/orders/${c.id}/cancel`).auth(buyer, { type: "bearer" }).expect(409)).body.code).toBe("ORDER_NOT_CANCELLABLE");
    });

    it("không xem hay hủy được đơn của người khác (404)", async () => {
      await setCart(t, buyer, L201, 1).expect(200);
      const order = (await place(t, buyer, await body("cod")).expect(201)).body;
      const stranger = await login(t, "khachtuchoi@example.com");
      await request(t.http()).get(`/api/orders/${order.id}`).auth(stranger, { type: "bearer" }).expect(404);
      await request(t.http()).post(`/api/orders/${order.id}/cancel`).auth(stranger, { type: "bearer" }).expect(404);
      const mine = await request(t.http()).get("/api/orders").auth(buyer, { type: "bearer" }).expect(200);
      expect(mine.body.items).toHaveLength(1);
      expect(mine.body.nextCursor).toBeNull();
    });
  });

});
