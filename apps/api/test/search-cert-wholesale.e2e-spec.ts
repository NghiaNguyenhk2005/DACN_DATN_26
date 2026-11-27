import { randomUUID } from "node:crypto";
import request from "supertest";
import { PaymentGateway } from "../src/integrations/payment-gateway";
import { createTestApp, login, type TestApp } from "./support";

describe("Tìm kiếm có gợi ý, chứng nhận và sản phẩm của nhà cung cấp, yêu cầu báo giá sỉ", () => {
  let t: TestApp;
  let seller: string;
  let mod: string;
  let wholesale: string;
  let retail: string;

  beforeAll(async () => {
    t = await createTestApp();
    [seller, mod, wholesale, retail] = await Promise.all([
      login(t, "seller@farmery.vn"),
      login(t, "kiemduyet@farmery.vn"),
      login(t, "khachsi@example.com"),
      login(t, "khachle@example.com"),
    ]);
  });
  afterAll(() => t.app.close());
  beforeEach(() => request(t.http()).post("/api/dev/reset").expect(204));

  const get = (path: string, token?: string) => {
    const r = request(t.http()).get(path);
    return token ? r.auth(token, { type: "bearer" }) : r;
  };
  const post = (path: string, token: string, body: object) =>
    request(t.http()).post(path).auth(token, { type: "bearer" }).set("Idempotency-Key", randomUUID()).send(body);

  describe("GET /search/suggest", () => {
    it("tách cụm lọc khỏi câu tìm và gợi ý sản phẩm theo phần còn lại", async () => {
      const res = await get(`/api/search/suggest?q=${encodeURIComponent("dâu tây hữu cơ dưới 200k")}`).expect(200);
      expect(res.body.interpretation).toMatchObject({ keywords: "dâu tây", cert: "organic", maxPrice: 200000 });
      expect(res.body.interpretation.phrases).toEqual(["hữu cơ", "dưới 200k"]);
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    it("hiểu vùng trồng và khoảng giá 'từ … đến …'", async () => {
      const res = await get(`/api/search/suggest?q=${encodeURIComponent("rau Đơn Dương từ 20k đến 50k")}`).expect(200);
      expect(res.body.interpretation).toMatchObject({ keywords: "rau", region: "Đơn Dương", minPrice: 20000, maxPrice: 50000 });
    });

    it("mở rộng nghĩa: 'salad' ra xà lách, 'đồ uống' ra trà, cà phê", async () => {
      const salad = await get("/api/search/suggest?q=salad").expect(200);
      expect(salad.body.products.some((p: { name: string }) => p.name.includes("Xà lách"))).toBe(true);
      const drinks = await get(`/api/products?q=${encodeURIComponent("đồ uống")}`).expect(200);
      expect(drinks.body.items.length).toBeGreaterThan(0);
      expect(drinks.body.items.some((p: { name: string }) => /Trà|Cà phê/.test(p.name))).toBe(true);
    });

    it("gõ sai vẫn ra sản phẩm hoặc có gợi ý sửa", async () => {
      const fixed = await get(`/api/search/suggest?q=${encodeURIComponent("xà láhc")}`).expect(200);
      expect(fixed.body.products.length > 0 || fixed.body.correction === "xà lách").toBe(true);
    });
  });

  describe("Danh mục, thẻ sản phẩm", () => {
    it("danh mục có ảnh và số sản phẩm (cha cộng cả con)", async () => {
      const res = await get("/api/categories").expect(200);
      const fruit = res.body.find((c: { id: string }) => c.id === "1");
      expect(fruit.imageUrl).toMatch(/^https:/);
      const childSum = fruit.children.reduce((s: number, c: { productCount: number }) => s + c.productCount, 0);
      expect(fruit.productCount).toBe(childSum);
      expect(fruit.productCount).toBeGreaterThan(0);
    });

    it("thẻ sản phẩm có lô bán trước; chi tiết có bảng giá sỉ khi nhà cung cấp nhận bán sỉ", async () => {
      const list = await get("/api/products?limit=50").expect(200);
      expect(list.body.items.find((p: { id: string }) => p.id === "1").saleBatch).toMatchObject({ harvestDate: expect.any(String) });
      const detail = await get("/api/products/17").expect(200);
      expect(detail.body.wholesale).toMatchObject({ saleUnit: "kg", minQuantity: 200 });
      expect((await get("/api/products/2").expect(200)).body.wholesale).toBeNull();
    });
  });

  describe("Chứng nhận của nhà cung cấp", () => {
    it("khai chứng nhận → chờ duyệt, chưa công khai → kiểm duyệt duyệt → công khai, còn hiệu lực", async () => {
      const input = { type: "HACCP", certificateNumber: "HACCP-LD-0099", issuingAuthority: "Bureau Veritas Việt Nam", issuedDate: "2026-09-01", expiryDate: "2029-09-01" };
      const created = (await post("/api/seller/certifications", seller, input).expect(201)).body;
      expect(created).toMatchObject({ status: "pending_review", valid: false, type: "HACCP" });

      const mine = (await get("/api/seller/certifications", seller).expect(200)).body;
      expect(mine[0].id).toBe(created.id);
      const before = (await get("/api/suppliers/101").expect(200)).body;
      expect(before.certifications.some((c: { type: string }) => c.type === "HACCP")).toBe(false);

      const tasks = (await get("/api/admin/review-tasks?type=certification&status=open", mod).expect(200)).body.items;
      const task = tasks.find((x: { targetId: string }) => x.targetId === created.id);
      const detail = (await get(`/api/admin/review-tasks/${task.id}`, mod).expect(200)).body;
      expect(detail.certification.certification.certificateNumber).toBe("HACCP-LD-0099");
      await request(t.http()).post(`/api/admin/review-tasks/${task.id}/approve`).auth(mod, { type: "bearer" }).expect(200);

      const after = (await get("/api/suppliers/101").expect(200)).body;
      expect(after.certifications.find((c: { type: string }) => c.type === "HACCP")).toMatchObject({ valid: true });
    });

    it("ngày hết hiệu lực trước ngày cấp → 422; khách lẻ không gọi được → 403", async () => {
      const bad = { type: "VietGAP", certificateNumber: "VG-1", issuingAuthority: "Chi cục", issuedDate: "2026-09-01", expiryDate: "2026-08-01" };
      await post("/api/seller/certifications", seller, bad).expect(422);
      await get("/api/seller/certifications", retail).expect(403);
    });
  });

  describe("Sản phẩm của nhà cung cấp", () => {
    it("đăng sản phẩm → chờ duyệt, chưa hiện công khai → duyệt → tìm thấy", async () => {
      const created = (
        await post("/api/seller/products", seller, { categoryId: "13", name: "Mâm xôi đỏ Đà Lạt", unit: "hộp 125g", certifications: ["VietGAP"] }).expect(201)
      ).body;
      expect(created).toMatchObject({ status: "pending_review", categoryId: "13", unit: "hộp 125g" });
      await get(`/api/products/${created.id}`).expect(404);
      expect((await get("/api/seller/products", seller).expect(200)).body.some((p: { id: string }) => p.id === created.id)).toBe(true);

      const tasks = (await get("/api/admin/review-tasks?type=product&status=open", mod).expect(200)).body.items;
      const task = tasks.find((x: { targetId: string }) => x.targetId === created.id);
      expect((await get(`/api/admin/review-tasks/${task.id}`, mod).expect(200)).body.product.product.name).toBe("Mâm xôi đỏ Đà Lạt");
      await request(t.http()).post(`/api/admin/review-tasks/${task.id}/approve`).auth(mod, { type: "bearer" }).expect(200);
      await get(`/api/products/${created.id}`).expect(200);
    });

    it("gắn chứng nhận chưa khai → 422; danh mục cha → 422", async () => {
      await post("/api/seller/products", seller, { categoryId: "13", name: "Mâm xôi", unit: "hộp", certifications: ["GlobalGAP"] }).expect(422);
      await post("/api/seller/products", seller, { categoryId: "1", name: "Mâm xôi", unit: "hộp" }).expect(422);
    });

    it("danh sách lô chỉ có lô của nhà cung cấp đang đăng nhập", async () => {
      const batches = (await get("/api/seller/batches", seller).expect(200)).body as { productId: string }[];
      const own = new Set(((await get("/api/seller/products", seller).expect(200)).body as { id: string }[]).map((p) => p.id));
      expect(batches.length).toBeGreaterThan(0);
      expect(batches.every((b) => own.has(b.productId))).toBe(true);
    });
  });

  describe("Yêu cầu báo giá sỉ", () => {
    it("doanh nghiệp mua sỉ gửi → đơn giá theo bậc → nhà cung cấp thấy trong danh sách", async () => {
      const created = (await post("/api/wholesale/quote-requests", wholesale, { productId: "1", quantity: 55, neededBy: "2026-11-30", note: "Giao Thủ Đức" }).expect(201)).body;
      expect(created).toMatchObject({ status: "sent", estimatedUnitPrice: 195000, saleUnit: "kg", buyerName: "GreenMart — Phòng thu mua" });
      const list = (await get("/api/seller/quote-requests", seller).expect(200)).body;
      expect(list.map((r: { id: string }) => r.id)).toContain(created.id);
    });

    it("dưới lượng tối thiểu, sản phẩm không bán sỉ, ngày quá khứ → 422; khách lẻ → 403", async () => {
      expect((await post("/api/wholesale/quote-requests", wholesale, { productId: "1", quantity: 5, neededBy: "2026-11-30" }).expect(422)).body.code).toBe("BELOW_MIN_QUANTITY");
      expect((await post("/api/wholesale/quote-requests", wholesale, { productId: "2", quantity: 50, neededBy: "2026-11-30" }).expect(422)).body.code).toBe("WHOLESALE_NOT_OFFERED");
      await post("/api/wholesale/quote-requests", wholesale, { productId: "1", quantity: 50, neededBy: "2026-10-01" }).expect(422);
      await post("/api/wholesale/quote-requests", retail, { productId: "1", quantity: 50, neededBy: "2026-11-30" }).expect(403);
    });

    describe("Quy trình bán sỉ: phản hồi 1 lượt, ký hợp đồng OTP, thanh toán và giao 1 đợt", () => {
      it("gửi RFQ → NCC báo giá 1 lượt → khách sỉ chấp nhận → ký OTP → thanh toán PaymentService → giao 1 đợt", async () => {
        // 1. Khách sỉ gửi RFQ
        const rfq = (
          await post("/api/wholesale/quote-requests", wholesale, {
            productId: "1",
            quantity: 100,
            neededBy: "2026-12-15",
            note: "Giao kho Thủ Đức xe lạnh",
          }).expect(201)
        ).body;
        expect(rfq.status).toBe("sent");

        // 2. Khách sỉ xem danh sách yêu cầu của mình
        const myRfqs = (await get("/api/wholesale/quote-requests", wholesale).expect(200)).body;
        expect(myRfqs.some((r: { id: string }) => r.id === rfq.id)).toBe(true);

        // 3. Nhà cung cấp phản hồi báo giá 1 lượt
        const quoted = (
          await post(`/api/seller/quote-requests/${rfq.id}/quote`, seller, {
            proposedPrice: 190000,
            proposedQty: 100,
            proposedDelivery: "2026-12-14",
            note: "HTX đáp ứng đủ 100kg dâu tây đạt chuẩn.",
          }).expect(200)
        ).body;
        expect(quoted.status).toBe("quoted");
        expect(quoted.quoteResponse).toMatchObject({
          proposedPrice: 190000,
          proposedQty: 100,
          proposedDelivery: "2026-12-14",
        });

        // 4. Khách sỉ chấp nhận báo giá -> Sinh hợp đồng mẫu
        const accepted = (
          await post(`/api/wholesale/quote-requests/${rfq.id}/respond`, wholesale, {
            action: "accept",
          }).expect(200)
        ).body;
        expect(accepted.status).toBe("accepted");
        expect(accepted.contract).toMatchObject({
          contractCode: `HD-2026-${rfq.id}`,
          agreedQty: 100,
          agreedUnitPrice: 190000,
          totalAmount: 19000000,
          status: "draft",
        });
        expect(accepted.contract.documentHash).toBeDefined();

        // 5. Yêu cầu gửi OTP ký hợp đồng
        const otpReq = (await post(`/api/wholesale/quote-requests/${rfq.id}/request-otp`, wholesale, {}).expect(200)).body;
        expect(otpReq.sent).toBe(true);
        expect(otpReq.devCode).toBe("123456");

        // 6. Nhập sai OTP -> 400
        await post(`/api/wholesale/quote-requests/${rfq.id}/confirm-otp`, wholesale, { code: "999999" }).expect(400);

        // 7. Nhập đúng OTP -> Giao kết hợp đồng
        const confirmed = (
          await post(`/api/wholesale/quote-requests/${rfq.id}/confirm-otp`, wholesale, { code: "123456" }).expect(200)
        ).body;
        expect(confirmed.status).toBe("confirmed");
        expect(confirmed.contract.status).toBe("concluded");
        expect(confirmed.contract.concludedAt).toBeDefined();

        // 8. Có thể thử lại khi cổng thanh toán từ chối hoặc hết hạn.
        const payPath = `/api/wholesale/quote-requests/${rfq.id}/pay`;
        const charge = jest.spyOn(t.app.get(PaymentGateway), "charge")
          .mockResolvedValueOnce({ status: "failed", reference: null })
          .mockResolvedValueOnce({ status: "expired", reference: null });
        try {
          for (const expected of ["failed", "expired"]) {
            const rejected = await post(payPath, wholesale, {}).expect(409);
            expect(rejected.body.code).toBe("PAYMENT_FAILED");
            expect(await charge.mock.results.at(-1)?.value).toMatchObject({ status: expected });
          }
        } finally {
          charge.mockRestore();
        }
        const paid = (await post(payPath, wholesale, {}).expect(200)).body;
        expect(paid.status).toBe("paid");
        expect(paid.payment).toMatchObject({
          amount: 19000000,
          status: "succeeded",
        });
        expect(paid.delivery).toMatchObject({
          deliveryType: "single_batch",
          status: "awaiting_delivery",
        });
        expect(paid.wholesaleOrder).toMatchObject({
          status: "awaiting_delivery",
        });

        // 9. Nhà cung cấp xuất kho và bắt đầu giao hàng 1 đợt (FR6.4)
        const shipped = (await post(`/api/wholesale/quote-requests/${rfq.id}/ship`, seller, {}).expect(200)).body;
        expect(shipped.wholesaleOrder.status).toBe("shipping");
        expect(shipped.wholesaleOrder.shippedAt).toBeDefined();
        expect(shipped.delivery.status).toBe("shipping");

        // 10. Khách sỉ nhận hàng giao 1 đợt, trừ tồn và sinh đối soát hoa hồng (FR6.4, FR7.4)
        const completed = (await post(`/api/wholesale/quote-requests/${rfq.id}/deliver`, wholesale, { rejectedQty: 0 }).expect(200)).body;
        expect(completed.status).toBe("completed");
        expect(completed.wholesaleOrder.status).toBe("delivered");
        expect(completed.wholesaleOrder.receivedAt).toBeDefined();
        expect(completed.settlement).toMatchObject({
          grossAmount: 19000000,
          commissionRate: 0.05,
          commissionAmount: 950000,
          withholdingRate: 0.01,
          withholdingAmount: 190000,
          netPayout: 17860000,
        });

        // 11. Nhà cung cấp tra cứu danh sách đối soát hoa hồng (FR7.4)
        const settlements = (await get("/api/seller/commission-settlements", seller).expect(200)).body;
        expect(settlements.length).toBeGreaterThan(0);
        expect(settlements.some((s: { wholesaleOrderId?: string }) => s.wholesaleOrderId === paid.wholesaleOrder.orderId)).toBe(true);
      });

      it("khách sỉ từ chối báo giá thì đóng RFQ", async () => {
        const rfq = (
          await post("/api/wholesale/quote-requests", wholesale, {
            productId: "1",
            quantity: 80,
            neededBy: "2026-12-15",
          }).expect(201)
        ).body;

        await post(`/api/seller/quote-requests/${rfq.id}/quote`, seller, {
          proposedPrice: 200000,
          proposedQty: 80,
          proposedDelivery: "2026-12-16",
        }).expect(200);

        const rejected = (
          await post(`/api/wholesale/quote-requests/${rfq.id}/respond`, wholesale, {
            action: "reject",
            rejectReason: "Giá quá cao",
          }).expect(200)
        ).body;
        expect(rejected.status).toBe("rejected");
        expect(rejected.rejectReason).toBe("Giá quá cao");
      });
    });

    describe("Kho tệp MinIO qua URL ký trước và kiểm kiểu tệp thật (Media)", () => {
      it("yêu cầu URL ký trước thành công cho tệp hợp lệ (≤ 5MB)", async () => {
        const res = (
          await post("/api/media/presigned", seller, {
            fileName: "chung_nhan_vietgap.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 150000,
            accessLevel: "public",
          }).expect(200)
        ).body;
        expect(res.fileId).toBeDefined();
        expect(res.uploadUrl).toContain("farmery-media");
        expect(res.expiresInSeconds).toBe(900);
      });

      it("chặn tệp quá kích thước 5MB hoặc định dạng không cho phép", async () => {
        await post("/api/media/presigned", seller, {
          fileName: "video.mp4",
          mimeType: "video/mp4",
          sizeBytes: 100000,
        }).expect(415);

        await post("/api/media/presigned", seller, {
          fileName: "huge.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 6 * 1024 * 1024,
        }).expect(413);
      });

      it("kiểm tra magic bytes thực tế: phát hiện tệp giả mạo", async () => {
        const init = (
          await post("/api/media/presigned", seller, {
            fileName: "script.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 500,
          }).expect(200)
        ).body;

        // Gửi nội dung giả mạo (text/bash script nhưng đuôi .jpg)
        const fakeContent = Buffer.from("#!/bin/bash\necho hello").toString("base64");
        await post("/api/media/confirm", seller, {
          fileId: init.fileId,
          contentBase64: fakeContent,
        }).expect(415);
      });

      it("xác nhận tệp ảnh thật: sinh các cỡ WebP (thumbnail, medium, large)", async () => {
        const init = (
          await post("/api/media/presigned", seller, {
            fileName: "photo.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 1024,
          }).expect(200)
        ).body;

        // Magic bytes JPEG hợp lệ (FF D8 FF)
        const realJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]).toString("base64");
        const confirmed = (
          await post("/api/media/confirm", seller, {
            fileId: init.fileId,
            contentBase64: realJpeg,
          }).expect(200)
        ).body;

        expect(confirmed.status).toBe("ready");
        expect(confirmed.variants).toMatchObject({
          thumbnail: { width: 150, height: 150, format: "webp" },
          medium: { width: 600, height: 600, format: "webp" },
          large: { width: 1200, height: 1200, format: "webp" },
        });
      });
    });
  });
});
