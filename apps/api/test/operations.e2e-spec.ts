import request from "supertest";
import { addAddress, createTestApp, firstSlot, holdingOf, login, place, setCart, type TestApp } from "./support";

describe("Vận hành đơn, dòng tồn, cấu hình, /dev/reset", () => {
  let t: TestApp;
  let buyer: string;
  let ops: string;
  let warehouse: string;
  let owner: string;
  let addressId: string;

  beforeEach(async () => {
    t = await createTestApp();
    [buyer, ops, warehouse, owner] = await Promise.all(
      ["khachle@example.com", "vanhanh@farmery.vn", "kho@farmery.vn", "chu@farmery.vn"].map((e) => login(t, e)),
    ) as [string, string, string, string];
    addressId = await addAddress(t, buyer);
  });
  afterEach(() => t.app.close());

  const get = (path: string, token: string) => request(t.http()).get(path).auth(token, { type: "bearer" });
  const advance = (id: string, token: string, note?: string) =>
    request(t.http()).post(`/api/admin/orders/${id}/advance`).auth(token, { type: "bearer" }).send(note ? { note } : {});

  async function codOrder(listingId = "201", quantity = 2): Promise<{ id: string; orderCode: string }> {
    await setCart(t, buyer, listingId, quantity).expect(200);
    const res = await place(t, buyer, { addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption: "cod" }).expect(201);
    return res.body;
  }

  describe("chuyển bước đơn", () => {
    it("vận hành đi hết tám bước; mỗi bước ghi một sự kiện source=staff; khách thấy dòng thời gian cập nhật", async () => {
      const order = await codOrder();
      const expected = ["packing", "on_trip", "handed_to_3pl", "delivering", "delivered", "completed"];
      for (const [i, status] of expected.entries()) {
        const res = await advance(order.id, ops, i === 0 ? "Đã soạn hàng" : undefined).expect(200);
        expect(res.body.status).toBe(status);
        expect(res.body.timeline.at(-1)).toMatchObject({ toStatus: status, source: "staff", note: i === 0 ? "Đã soạn hàng" : null });
        expect(res.body.buyerName).toBe("Khách lẻ Trần Minh Anh");
      }
      const mine = await request(t.http()).get(`/api/orders/${order.id}`).auth(buyer, { type: "bearer" }).expect(200);
      expect(mine.body.timeline.map((e: { toStatus: string }) => e.toStatus)).toEqual([
        "placed", "paid", "packing", "on_trip", "handed_to_3pl", "delivering", "delivered", "completed",
      ]);
      expect(mine.body.buyerName).toBeUndefined(); // API của khách không lộ tên người mua
      const done = await advance(order.id, ops).expect(409);
      expect(done.body.code).toBe("ORDER_TRANSITION_INVALID");
    });

    it("đơn chờ thanh toán hoặc đã hủy trả 409 ORDER_TRANSITION_INVALID; đơn lạ trả 404", async () => {
      await setCart(t, buyer, "201", 1).expect(200);
      const placed = (await place(t, buyer, { addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption: "prepaid" }).expect(201)).body;
      expect((await advance(placed.id, ops).expect(409)).body.code).toBe("ORDER_TRANSITION_INVALID");
      await request(t.http()).post(`/api/orders/${placed.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);
      expect((await advance(placed.id, ops).expect(409)).body.code).toBe("ORDER_TRANSITION_INVALID");
      await advance("424242", ops).expect(404);
    });

    it("kho chỉ chuyển bước phía kho; bước sau đó trả 403; vai trò khác không được gọi", async () => {
      const order = await codOrder();
      for (const status of ["packing", "on_trip", "handed_to_3pl"]) {
        expect((await advance(order.id, warehouse).expect(200)).body.status).toBe(status);
      }
      const denied = await advance(order.id, warehouse).expect(403);
      expect(denied.body.code).toBe("FORBIDDEN_ROLE");
      expect((await get(`/api/admin/orders/${order.id}`, ops).expect(200)).body.status).toBe("handed_to_3pl");
      expect((await advance(order.id, ops).expect(200)).body.status).toBe("delivering");
      await advance(order.id, owner).expect(403);
      await advance(order.id, buyer).expect(403);
    });
  });

  describe("danh sách đơn nội bộ", () => {
    it("mới nhất trước, lọc theo trạng thái, phân trang bằng cursor, có tên người mua", async () => {
      const first = await codOrder();
      const second = await codOrder();
      await advance(first.id, ops).expect(200);

      const all = (await get("/api/admin/orders", ops).expect(200)).body;
      expect(all.items.map((o: { id: string }) => o.id)).toEqual([second.id, first.id]);
      expect(all.items[0]).toMatchObject({ status: "paid", buyerName: "Khách lẻ Trần Minh Anh", itemCount: 1 });

      const packing = (await get("/api/admin/orders?status=packing", warehouse).expect(200)).body;
      expect(packing.items.map((o: { id: string }) => o.id)).toEqual([first.id]);

      const page1 = (await get("/api/admin/orders?limit=1", ops).expect(200)).body;
      expect(page1.items).toHaveLength(1);
      const page2 = (await get(`/api/admin/orders?limit=1&cursor=${page1.nextCursor}`, ops).expect(200)).body;
      expect(page2.items[0].id).toBe(first.id);
      expect(page2.nextCursor).toBeNull();
    });

    it("chỉ vận hành và kho được xem; khách, nhân sự khác bị chặn", async () => {
      await get("/api/admin/orders", buyer).expect(403);
      await get("/api/admin/orders", owner).expect(403);
      await request(t.http()).get("/api/admin/orders").expect(401);
    });
  });

  describe("dòng tồn và sổ nhập xuất", () => {
    it("dòng tồn khớp lô đã duyệt; lọc theo lô và sản phẩm; chỉ kho và vận hành xem", async () => {
      const all = (await get("/api/admin/inventory/holdings", warehouse).expect(200)).body as { batchId: string; ownerType: string }[];
      expect(all).toHaveLength(15); // 15 lô đã duyệt có sản phẩm
      expect(all.every((h) => h.ownerType === "farmery")).toBe(true);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ batchCode: "DTDL-2610-01", qtyOnHand: 150, qtyReserved: 0, isLocked: false, saleUnit: "hộp 500g" });
      expect((await get("/api/admin/inventory/holdings?productId=2", ops).expect(200)).body).toHaveLength(1);
      await get("/api/admin/inventory/holdings", buyer).expect(403);
      await get("/api/admin/inventory/holdings", owner).expect(403);
    });

    it("sổ nhập xuất ghi đủ nhập, giữ chỗ, trừ tồn, hoàn tồn; mới nhất trước; holding lạ 404", async () => {
      const holding = await holdingOf(t, ops, "1001");
      await setCart(t, buyer, "201", 4).expect(200);
      const order = (await place(t, buyer, { addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption: "cod" }).expect(201)).body;
      await request(t.http()).post(`/api/orders/${order.id}/cancel`).auth(buyer, { type: "bearer" }).expect(200);

      const ledger = (await get(`/api/admin/inventory/holdings/${holding.id}/movements`, warehouse).expect(200)).body as {
        movementType: string; quantity: number; sourceType: string; sourceId: string;
      }[];
      expect(ledger.map((m) => [m.movementType, m.quantity])).toEqual([
        ["return_in", 4],
        ["retail_out", -4],
        ["reserve", -4],
        ["open_from_batch", 150],
      ]);
      expect(ledger[0]).toMatchObject({ sourceType: "retail_order", sourceId: order.id });
      expect(ledger[3]).toMatchObject({ sourceType: "batch", sourceId: "1001" });
      await get("/api/admin/inventory/holdings/999999/movements", ops).expect(404);
    });
  });

  describe("cấu hình nền tảng", () => {
    it("mặc định theo hợp đồng; chủ nền tảng đổi một phần; vận hành chỉ đọc", async () => {
      const def = (await get("/api/admin/settings", ops).expect(200)).body;
      expect(def).toEqual({
        codMaxAmount: 1000000,
        cutoffTime: "16:00",
        deliverySlots: ["08:00-11:00", "14:00-17:00", "18:00-21:00"],
        shippingFee: 25000,
        freeShippingThreshold: 300000,
        reservationMinutes: 15,
        retailVatPercent: 5,
      });
      const put = (body: object, token = owner) => request(t.http()).put("/api/admin/settings").auth(token, { type: "bearer" }).send(body);
      expect((await put({ shippingFee: 30000 }).expect(200)).body).toMatchObject({ shippingFee: 30000, codMaxAmount: 1000000 });
      // đổi khóa khác không được đặt lại khóa đã đổi trước đó về mặc định
      await put({ codMaxAmount: 500000 }).expect(200);
      expect((await put({ reservationMinutes: 10 }).expect(200)).body).toMatchObject({ shippingFee: 30000, codMaxAmount: 500000, reservationMinutes: 10 });
      await put({ shippingFee: 1 }, ops).expect(403);
      await put({ shippingFee: 1 }, warehouse).expect(403);
      await get("/api/admin/settings", warehouse).expect(403);
    });

    it("giá trị sai bị từ chối 400: khóa lạ, rỗng, giờ chốt 29:00, khung giờ ngược/trùng, giữ chỗ 0 phút", async () => {
      const put = (body: object) => request(t.http()).put("/api/admin/settings").auth(owner, { type: "bearer" }).send(body);
      for (const bad of [
        { khongCo: 1 }, {}, { cutoffTime: "29:00" }, { shippingFee: -1 }, { reservationMinutes: 0 },
        { deliverySlots: [] }, { deliverySlots: ["11:00-08:00"] }, { deliverySlots: ["08:00-11:00", "08:00-11:00"] },
      ]) {
        const res = await put(bad).expect(400);
        expect(res.body.code).toBe("VALIDATION_FAILED");
      }
    });

    it("đổi cấu hình có hiệu lực ngay: cước, ngưỡng COD, khung giờ, giờ chốt, hạn giữ chỗ", async () => {
      await request(t.http()).put("/api/admin/settings").auth(owner, { type: "bearer" })
        .send({ shippingFee: 40000, freeShippingThreshold: 100000, codMaxAmount: 200000, cutoffTime: "09:00", deliverySlots: ["07:00-09:00"], reservationMinutes: 5 })
        .expect(200);
      await setCart(t, buyer, "201", 1).expect(200); // 125.000đ
      const q = (await request(t.http()).post("/api/checkout/quote").auth(buyer, { type: "bearer" }).send({ addressId }).expect(200)).body;
      expect(q).toMatchObject({ shippingFee: 0, totalAmount: 125000, codAllowed: true });
      expect(q.deliverySlots).toHaveLength(3);
      expect(q.deliverySlots[0]).toEqual({ date: "2026-10-21", slot: "07:00-09:00", available: false }); // 10:00 đã qua giờ chốt 09:00

      const order = (await place(t, buyer, { addressId, deliveryDate: "2026-10-22", deliverySlot: "07:00-09:00", paymentOption: "prepaid" }).expect(201)).body;
      expect(order.reserveExpiresAt).toBe("2026-10-21T03:05:00.000Z");
    });
  });

  describe("POST /dev/reset", () => {
    it("đưa đơn, giỏ, địa chỉ, tồn, cấu hình về ban đầu", async () => {
      await codOrder("201", 3);
      await setCart(t, buyer, "227", 1).expect(200);
      await request(t.http()).put("/api/admin/settings").auth(owner, { type: "bearer" }).send({ shippingFee: 1 }).expect(200);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 147 });

      await request(t.http()).post("/api/dev/reset").expect(204);

      expect((await get("/api/admin/orders", ops).expect(200)).body.items).toEqual([]);
      expect((await get("/api/cart", buyer).expect(200)).body.items).toEqual([]);
      expect((await get("/api/me/addresses", buyer).expect(200)).body).toEqual([expect.objectContaining({ id: "500" })]);
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 0 });
      expect((await get("/api/admin/settings", ops).expect(200)).body.shippingFee).toBe(25000);
      // đơn đầu tiên sau reset lại mang số thứ tự 0001
      await setCart(t, buyer, "201", 1).expect(200);
      const addr = await addAddress(t, buyer);
      const order = (await place(t, buyer, { addressId: addr, ...(await firstSlot(t, buyer, addr)), paymentOption: "cod" }).expect(201)).body;
      expect(order.orderCode).toBe("FM-261021-0001");
      expect(order.id).toBe("9001");
    });
  });
});
