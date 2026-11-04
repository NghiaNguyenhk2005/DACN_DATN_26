import { randomUUID } from "node:crypto";
import { call, login, MAIN, sleep } from "./client";

// Hành trình thật qua HTTP, giờ thật, không can thiệp vào bộ nhớ của server.
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

describe("Hành trình mua bán đầu–cuối", () => {
  let seller: string, moderator: string, buyer: string, rival: string, ops: string, warehouse: string, owner: string;
  let listingId: string;
  let batchId: string;
  let holdingId: string;
  let addressId: string;
  let rivalAddress: string;

  const key = () => ({ "Idempotency-Key": randomUUID() });
  const stock = async () => (await call(MAIN(), "GET", "/api/products/3")).body.listing.available as number;
  const holding = async () =>
    (await call(MAIN(), "GET", `/api/admin/inventory/holdings?batchId=${batchId}`, { token: warehouse })).body[0] as { id: string; qtyOnHand: number; qtyReserved: number };
  async function slot(token: string, address: string) {
    const quote = await call(MAIN(), "POST", "/api/checkout/quote", { token, body: { addressId: address } });
    expect(quote.status).toBe(200);
    const s = quote.body.deliverySlots.find((x: { available: boolean }) => x.available);
    return { deliveryDate: s.date as string, deliverySlot: s.slot as string };
  }
  async function order(token: string, address: string, paymentOption: "cod" | "prepaid", headers = key()) {
    return call(MAIN(), "POST", "/api/orders", { token, headers, body: { addressId: address, ...(await slot(token, address)), paymentOption } });
  }

  beforeAll(async () => {
    expect((await call(MAIN(), "POST", "/api/dev/reset")).status).toBe(204);
    [seller, moderator, buyer, rival, ops, warehouse, owner] = await Promise.all(
      ["seller@farmery.vn", "staff@example.com", "khachle@example.com", "khachtuchoi@example.com", "vanhanh@farmery.vn", "kho@farmery.vn", "chu@farmery.vn"].map((e) => login(MAIN(), e)),
    ) as [string, string, string, string, string, string, string];
    const created = await call(MAIN(), "POST", "/api/me/addresses", {
      token: rival,
      body: { recipientName: "Khách đối thủ", phone: "0976543210", addressLine: "5 Lê Lợi", ward: "Phường Bến Thành", province: "TP. Hồ Chí Minh" },
    });
    rivalAddress = created.body.id;
    addressId = (await call(MAIN(), "GET", "/api/me/addresses", { token: buyer })).body[0].id;
  });

  it("nhà cung cấp tạo lô, kiểm duyệt viên duyệt, hàng xuất hiện trên cửa hàng và trong kho", async () => {
    const product = await call(MAIN(), "GET", "/api/products/3");
    listingId = product.body.listing.id;
    expect(product.body.listing.available).toBe(0); // sản phẩm 3 chưa có lô đã duyệt nên chưa có hàng

    const batch = await call(MAIN(), "POST", "/api/seller/batches", {
      token: seller,
      body: { productId: "3", harvestDate: day(-1), bestBefore: day(10), declaredQuantity: 40 },
    });
    expect(batch.status).toBe(201);
    batchId = batch.body.id;
    expect(batch.body.status).toBe("pending_review");
    expect(await stock()).toBe(0); // chờ duyệt thì chưa bán được

    const tasks = await call(MAIN(), "GET", "/api/admin/review-tasks?type=batch&status=open", { token: moderator });
    const task = tasks.body.items.find((t: { targetId: string }) => t.targetId === batchId);
    expect((await call(MAIN(), "POST", `/api/admin/review-tasks/${task.id}/approve`, { token: moderator })).status).toBe(200);

    expect(await stock()).toBe(40);
    const h = await holding();
    holdingId = h.id;
    expect(h).toMatchObject({ qtyOnHand: 40, qtyReserved: 0 });
  });

  it("khách mua trả trước: giữ chỗ ~15 phút, tồn giảm ngay, thanh toán thì trừ tồn, sổ nhập xuất ghi đủ", async () => {
    expect((await call(MAIN(), "PUT", `/api/cart/items/${listingId}`, { token: buyer, body: { quantity: 10 } })).status).toBe(200);
    const placed = await order(buyer, addressId, "prepaid");
    expect(placed.status).toBe(201);
    expect(placed.body.status).toBe("placed");
    const ttl = (Date.parse(placed.body.reserveExpiresAt) - Date.now()) / 60_000;
    expect(ttl).toBeGreaterThan(14);
    expect(ttl).toBeLessThanOrEqual(15);
    expect(placed.body.items[0]).toMatchObject({ quantity: 10, batchCode: expect.any(String), traceCode: expect.stringMatching(/^TRC-/) });
    expect(await stock()).toBe(30);
    expect(await holding()).toMatchObject({ qtyOnHand: 40, qtyReserved: 10 });

    const paid = await call(MAIN(), "POST", `/api/orders/${placed.body.id}/pay`, { token: buyer });
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe("paid");
    expect(await holding()).toMatchObject({ qtyOnHand: 30, qtyReserved: 0 });
    expect((await call(MAIN(), "POST", `/api/orders/${placed.body.id}/pay`, { token: buyer })).body.code).toBe("ORDER_NOT_PAYABLE");

    const ledger = (await call(MAIN(), "GET", `/api/admin/inventory/holdings/${holdingId}/movements`, { token: warehouse })).body;
    expect(ledger.map((m: { movementType: string }) => m.movementType)).toEqual(["retail_out", "reserve", "open_from_batch"]);

    // Vận hành đưa đơn đi hết tám bước; khách thấy từng bước.
    for (const status of ["packing", "on_trip", "handed_to_3pl", "delivering", "delivered", "completed"]) {
      const res = await call(MAIN(), "POST", `/api/admin/orders/${placed.body.id}/advance`, { token: status === "packing" ? warehouse : ops });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
    const mine = await call(MAIN(), "GET", `/api/orders/${placed.body.id}`, { token: buyer });
    expect(mine.body.timeline.map((e: { toStatus: string }) => e.toStatus)).toEqual(["placed", "paid", "packing", "on_trip", "handed_to_3pl", "delivering", "delivered", "completed"]);
    expect((await call(MAIN(), "POST", `/api/admin/orders/${placed.body.id}/advance`, { token: ops })).status).toBe(409);
  });

  it("hai khách tranh nhau phần hàng còn lại cùng lúc: đúng một người được, không bán vượt", async () => {
    // Còn 30; mỗi người đặt 20.
    for (const [token] of [[buyer], [rival]] as const) {
      expect((await call(MAIN(), "PUT", `/api/cart/items/${listingId}`, { token, body: { quantity: 20 } })).status).toBe(200);
    }
    const [a, b] = await Promise.all([order(buyer, addressId, "prepaid"), order(rival, rivalAddress, "prepaid")]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect((a.status === 409 ? a : b).body.code).toBe("STOCK_CONFLICT");
    expect(await holding()).toMatchObject({ qtyOnHand: 30, qtyReserved: 20 });
    expect(await stock()).toBe(10);
    // Người thua vẫn giữ giỏ để sửa số lượng.
    const loser = a.status === 409 ? buyer : rival;
    expect((await call(MAIN(), "GET", "/api/cart", { token: loser })).body.items).toHaveLength(1);
    // Hủy đơn thắng để trả lại hàng.
    const winner = a.status === 201 ? { token: buyer, order: a.body } : { token: rival, order: b.body };
    expect((await call(MAIN(), "POST", `/api/orders/${winner.order.id}/cancel`, { token: winner.token })).status).toBe(200);
    expect(await holding()).toMatchObject({ qtyOnHand: 30, qtyReserved: 0 });
    await call(MAIN(), "DELETE", `/api/cart/items/${listingId}`, { token: loser });
  });

  it("Idempotency-Key: gửi lại và gửi song song 5 lần chỉ tạo một đơn; cùng key khác nội dung bị 422", async () => {
    await call(MAIN(), "PUT", `/api/cart/items/${listingId}`, { token: buyer, body: { quantity: 3 } });
    const headers = key();
    const body = { addressId, ...(await slot(buyer, addressId)), paymentOption: "prepaid" };
    const results = await Promise.all(Array.from({ length: 5 }, () => call(MAIN(), "POST", "/api/orders", { token: buyer, headers, body })));
    expect(new Set(results.map((r) => r.status))).toEqual(new Set([201]));
    expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
    expect(await holding()).toMatchObject({ qtyReserved: 3 });
    const reused = await call(MAIN(), "POST", "/api/orders", { token: buyer, headers, body: { ...body, paymentOption: "cod" } });
    expect(reused.status).toBe(422);
    expect(reused.body.code).toBe("IDEMPOTENCY_KEY_REUSED");
    await call(MAIN(), "POST", `/api/orders/${results[0]?.body.id}/cancel`, { token: buyer });
  });

  it("cấu hình đổi có hiệu lực ngay: chỉ Chủ nền tảng được đổi; khóa không gửi giữ nguyên", async () => {
    await call(MAIN(), "PUT", `/api/cart/items/${listingId}`, { token: buyer, body: { quantity: 1 } });
    const before = (await call(MAIN(), "POST", "/api/checkout/quote", { token: buyer, body: { addressId } })).body;
    expect((await call(MAIN(), "PUT", "/api/admin/settings", { token: ops, body: { shippingFee: 0 } })).status).toBe(403);

    expect((await call(MAIN(), "PUT", "/api/admin/settings", { token: owner, body: { shippingFee: 12000 } })).status).toBe(200);
    const res = await call(MAIN(), "PUT", "/api/admin/settings", { token: owner, body: { codMaxAmount: 50000 } });
    expect(res.body).toMatchObject({ shippingFee: 12000, codMaxAmount: 50000 }); // khóa trước đó không bị đặt lại
    const after = (await call(MAIN(), "POST", "/api/checkout/quote", { token: buyer, body: { addressId } })).body;
    expect(after.totalAmount - after.subtotal).toBe(12000);
    expect(before.totalAmount - before.subtotal).not.toBe(12000);
    expect(after.codAllowed).toBe(after.totalAmount <= 50000);
    await call(MAIN(), "DELETE", `/api/cart/items/${listingId}`, { token: buyer });
    await call(MAIN(), "PUT", "/api/admin/settings", { token: owner, body: { shippingFee: 25000, codMaxAmount: 1000000 } });
  });

  const slow = process.env.BLACKBOX_SKIP_SLOW ? it.skip : it;
  slow("giữ chỗ hết hạn theo giờ thật: đơn tự hủy, tồn được trả lại, thanh toán muộn bị 409", async () => {
    expect((await call(MAIN(), "PUT", "/api/admin/settings", { token: owner, body: { reservationMinutes: 1 } })).status).toBe(200);
    await call(MAIN(), "PUT", `/api/cart/items/${listingId}`, { token: buyer, body: { quantity: 5 } });
    const placed = await order(buyer, addressId, "prepaid");
    expect(placed.status).toBe(201);
    const reserveExpiresAt = placed.body.reserveExpiresAt as string;
    expect(Date.parse(reserveExpiresAt) - Date.now()).toBeLessThanOrEqual(60_000);
    expect(await holding()).toMatchObject({ qtyReserved: 5 });

    await sleep(Math.max(0, Date.parse(reserveExpiresAt) - Date.now()) + 12_000); // chờ quá hạn + một chu kỳ quét 10 giây

    // Kho (không đọc đơn) cũng phải thấy hàng đã nhả: nhờ bộ quét nền, không chỉ nhờ đọc đơn.
    expect(await holding()).toMatchObject({ qtyReserved: 0 });
    const cancelled = (await call(MAIN(), "GET", `/api/orders/${placed.body.id}`, { token: buyer })).body;
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.reserveExpiresAt).toBe(reserveExpiresAt); // giữ nguyên để shop báo "hết thời gian giữ chỗ"
    expect(cancelled.timeline.at(-1)).toMatchObject({ toStatus: "cancelled", source: "system", occurredAt: reserveExpiresAt });
    const late = await call(MAIN(), "POST", `/api/orders/${placed.body.id}/pay`, { token: buyer });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe("RESERVATION_EXPIRED");
    await call(MAIN(), "PUT", "/api/admin/settings", { token: owner, body: { reservationMinutes: 15 } });
  });

  it("/dev/reset đưa mọi thứ về ban đầu", async () => {
    expect((await call(MAIN(), "POST", "/api/dev/reset")).status).toBe(204);
    expect((await call(MAIN(), "GET", "/api/products/3")).body.listing.available).toBe(0);
    const fresh = await login(MAIN(), "vanhanh@farmery.vn");
    expect((await call(MAIN(), "GET", "/api/admin/orders", { token: fresh })).body.items).toEqual([]);
    expect((await call(MAIN(), "GET", "/api/admin/settings", { token: fresh })).body.reservationMinutes).toBe(15);
  });
});
