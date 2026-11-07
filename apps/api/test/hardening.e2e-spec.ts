import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/core/app-config";
import { Clock } from "../src/core/clock";
import { PaymentGateway } from "../src/integrations/payment-gateway";
import { addAddress, ADDRESS, createTestApp, firstSlot, holdingOf, login, place, setCart, TestClock } from "./support";

describe("loadConfig từ chối cấu hình nguy hiểm", () => {
  const prod = { NODE_ENV: "production", JWT_SECRET: "x".repeat(40), DEMO_MODE: "false", SMTP_URL: "smtp://localhost:25" };

  it("production cần JWT_SECRET đủ dài; secret mặc định chỉ dùng ngoài production", () => {
    expect(() => loadConfig({ ...prod, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ ...prod, JWT_SECRET: "ngan" })).toThrow(/ít nhất 32/);
    expect(loadConfig({ NODE_ENV: "development" }).jwtSecret).toBe("dev-only-secret");
    expect(loadConfig(prod).docsEnabled).toBe(false);
    expect(loadConfig(prod).validateResponses).toBe(false);
  });

  it("ngoài DEMO_MODE bắt buộc có SMTP; không cho CORS dấu *; số sai định dạng bị từ chối", () => {
    expect(() => loadConfig({ ...prod, SMTP_URL: undefined })).toThrow(/SMTP_URL/);
    expect(() => loadConfig({ ...prod, CORS_ORIGINS: "*" })).toThrow(/CORS_ORIGINS/);
    expect(() => loadConfig({ ...prod, PORT: "abc" })).toThrow(/PORT/);
    expect(() => loadConfig({ ...prod, RATE_LIMIT_ENABLED: "yes" })).toThrow(/RATE_LIMIT_ENABLED/);
    expect(loadConfig({ NODE_ENV: "production", JWT_SECRET: prod.JWT_SECRET, DEMO_MODE: "true" }).corsOrigins).toEqual([]);
  });
});

describe("Trần OTP theo giờ (đồng hồ chỉnh tay)", () => {
  it("quá số lần gửi trong một giờ thì 429, qua giờ mới thì gửi lại được", async () => {
    process.env.OTP_RESEND_COOLDOWN_SECONDS = "0";
    process.env.OTP_MAX_PER_HOUR = "3";
    const t = await createTestApp();
    try {
      const ask = () => request(t.http()).post("/api/auth/otp").send({ email: "khachle@example.com" });
      for (let i = 0; i < 3; i += 1) await ask().expect(200);
      const blocked = await ask().expect(429);
      expect(blocked.body.code).toBe("RATE_LIMITED");
      expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(3000);
      // email khác không bị ảnh hưởng
      await request(t.http()).post("/api/auth/otp").send({ email: "kho@farmery.vn" }).expect(200);
      t.clock.advanceMinutes(61);
      await ask().expect(200);
    } finally {
      delete process.env.OTP_RESEND_COOLDOWN_SECONDS;
      delete process.env.OTP_MAX_PER_HOUR;
      await t.app.close();
    }
  });
});

describe("Giới hạn tần suất theo IP trả 429 kèm header CORS", () => {
  it("trình duyệt của shop/admin đọc được 429 RATE_LIMITED; nguồn lạ vẫn không được CORS", async () => {
    process.env.RATE_LIMIT_ENABLED = "true";
    process.env.RATE_LIMIT_AUTH_MAX = "2";
    const t = await createTestApp();
    try {
      const ask = (origin: string) =>
        request(t.http()).post("/api/auth/otp").set("Origin", origin).send({ email: "khachle@example.com" });
      await ask("http://localhost:3000").expect(200);
      await ask("http://localhost:5173").expect(200);
      for (const origin of ["http://localhost:3000", "http://localhost:5173"]) {
        const blocked = await ask(origin).expect(429);
        expect(blocked.headers["access-control-allow-origin"]).toBe(origin);
        expect(blocked.headers["access-control-expose-headers"]).toContain("Retry-After");
        expect(blocked.headers["content-type"]).toContain("application/problem+json");
        expect(blocked.body).toMatchObject({ status: 429, code: "RATE_LIMITED" });
      }
      const stranger = await ask("http://evil.example").expect(429);
      expect(stranger.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      process.env.RATE_LIMIT_ENABLED = "false";
      delete process.env.RATE_LIMIT_AUTH_MAX;
      await t.app.close();
    }
  });
});

describe("Cổng thanh toán từ chối", () => {
  it("trả 409 PAYMENT_FAILED, đơn vẫn chờ thanh toán và giữ chỗ; thử lại được", async () => {
    let approve = false;
    const gateway: PaymentGateway = {
      charge: async (orderId: string) => ({ status: approve ? "succeeded" : "failed", reference: approve ? `ref-${orderId}` : null }),
    } as PaymentGateway;
    const clock = new TestClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Clock).useValue(clock)
      .overrideProvider(PaymentGateway).useValue(gateway)
      .compile();
    const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
    configureApp(app);
    await app.listen(0);
    const t = { app, clock, http: () => app.getHttpServer() };
    try {
      const buyer = await login(t, "khachle@example.com");
      const ops = await login(t, "vanhanh@farmery.vn");
      const addressId = await addAddress(t, buyer);
      await setCart(t, buyer, "201", 2).expect(200);
      const placed = (await place(t, buyer, { addressId, ...(await firstSlot(t, buyer, addressId)), paymentOption: "prepaid" }).expect(201)).body;

      const failed = await request(t.http()).post(`/api/orders/${placed.id}/pay`).auth(buyer, { type: "bearer" }).expect(409);
      expect(failed.body.code).toBe("PAYMENT_FAILED");
      const still = (await request(t.http()).get(`/api/orders/${placed.id}`).auth(buyer, { type: "bearer" })).body;
      expect(still).toMatchObject({ status: "placed", reserveExpiresAt: placed.reserveExpiresAt });
      expect(await holdingOf(t, ops, "1001")).toMatchObject({ qtyOnHand: 150, qtyReserved: 2 });

      approve = true;
      const ok = await request(t.http()).post(`/api/orders/${placed.id}/pay`).auth(buyer, { type: "bearer" }).expect(200);
      expect(ok.body.status).toBe("paid");
    } finally {
      await app.close();
    }
  });
});

describe("Trần dữ liệu mỗi người dùng", () => {
  it("tối đa 20 địa chỉ, địa chỉ thứ 21 trả 422 ADDRESS_LIMIT_REACHED", async () => {
    const t = await createTestApp();
    try {
      const buyer = await login(t, "khachtuchoi@example.com");
      for (let i = 0; i < 20; i += 1) await request(t.http()).post("/api/me/addresses").auth(buyer, { type: "bearer" }).send(ADDRESS).expect(201);
      const over = await request(t.http()).post("/api/me/addresses").auth(buyer, { type: "bearer" }).send(ADDRESS).expect(422);
      expect(over.body.code).toBe("ADDRESS_LIMIT_REACHED");
    } finally {
      await t.app.close();
    }
  });
});
