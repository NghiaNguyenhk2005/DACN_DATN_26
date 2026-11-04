import { createHmac } from "node:crypto";
import { call, login, mailCount, MAIN, otpFromMail, PROD, PROD_ORIGIN, TIGHT, type Reply } from "./client";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

function forge(secret: string, claims: Record<string, unknown>, alg: "HS256" | "HS512" = "HS256"): string {
  const head = b64({ alg, typ: "JWT" });
  const payload = b64(claims);
  const sig = createHmac(alg === "HS256" ? "sha256" : "sha512", secret).update(`${head}.${payload}`).digest("base64url");
  return `${head}.${payload}.${sig}`;
}

const now = () => Math.floor(Date.now() / 1000);
const goodClaims = (over: Record<string, unknown> = {}) => ({
  sub: "301", roles: ["platform_owner"], iss: "farmery-api", aud: "farmery", iat: now(), exp: now() + 3600, ...over,
});

/** Mọi lỗi phải là problem+json, không lộ stack/đường dẫn nội bộ, và không bao giờ là 500. */
function expectCleanError(res: Reply, status: number, code?: string): void {
  expect(res.status).toBe(status);
  expect(res.headers.get("content-type")).toContain("application/problem+json");
  expect(res.text).not.toMatch(/node_modules|\.js:\d+|\bat .*\(|stack/i);
  expect(res.body.status).toBe(status);
  if (code) expect(res.body.code).toBe(code);
}

describe("Header bảo mật và mã yêu cầu", () => {
  it("API trả header chống sniff/nhúng khung, không cache, không lộ framework", async () => {
    const res = await call(MAIN(), "GET", "/api/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("x-powered-by")).toBeNull();
  });

  it("production có HSTS; Swagger UI và /dev/reset đóng", async () => {
    const health = await call(PROD(), "GET", "/api/health");
    expect(health.headers.get("strict-transport-security")).toContain("max-age=");
    expect((await call(PROD(), "GET", "/docs")).status).toBe(404);
    expectCleanError(await call(PROD(), "POST", "/api/dev/reset"), 404, "DEMO_MODE_OFF");
    expect((await call(MAIN(), "GET", "/docs")).status).toBe(200);
  });

  it("trả lại X-Request-Id hợp lệ và ghi vào `instance` của lỗi; mã bẩn bị thay", async () => {
    const res = await call(MAIN(), "GET", "/api/me", { headers: { "X-Request-Id": "trace-abc-12345" } });
    expect(res.headers.get("x-request-id")).toBe("trace-abc-12345");
    expect(res.body.instance).toBe("urn:request:trace-abc-12345");
    const dirty = await call(MAIN(), "GET", "/api/me", { headers: { "X-Request-Id": "<script>x</script>" } });
    expect(dirty.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("Đầu vào xấu trả đúng mã HTTP, không bao giờ 500", () => {
  const rows: [string, () => Promise<Reply>, number, (string | undefined)?][] = [
    ["JSON hỏng", () => call(MAIN(), "POST", "/api/auth/otp", { raw: '{"email": ', headers: { "Content-Type": "application/json" } }), 400],
    ["body là mảng", () => call(MAIN(), "POST", "/api/auth/otp", { body: [1, 2] }), 400, "VALIDATION_FAILED"],
    ["email là số", () => call(MAIN(), "POST", "/api/auth/otp", { body: { email: 123 } }), 400, "VALIDATION_FAILED"],
    ["email dài 5000 ký tự", () => call(MAIN(), "POST", "/api/auth/otp", { body: { email: `${"a".repeat(5000)}@x.com` } }), 400, "VALIDATION_FAILED"],
    ["body 2MB", () => call(MAIN(), "POST", "/api/auth/otp", { raw: `{"email":"${"a".repeat(2_000_000)}"}`, headers: { "Content-Type": "application/json" } }), 413, "PAYLOAD_TOO_LARGE"],
    ["sai Content-Type", () => call(MAIN(), "POST", "/api/auth/otp", { raw: "hello", headers: { "Content-Type": "text/plain" } }), 415],
    ["lồng JSON 5000 tầng", () => call(MAIN(), "POST", "/api/auth/otp", { raw: `${'{"a":'.repeat(5000)}1${"}".repeat(5000)}`, headers: { "Content-Type": "application/json" } }), 400],
    ["đường dẫn lạ", () => call(MAIN(), "GET", "/api/khong-co"), 404, "NOT_IN_CONTRACT"],
    ["gốc /", () => call(MAIN(), "GET", "/"), 404],
    ["sai phương thức", () => call(MAIN(), "DELETE", "/api/health"), 405],
    ["header 20KB", () => call(MAIN(), "GET", "/api/health", { headers: { "X-Junk": "a".repeat(20_000) } }), 431, "HEADERS_TOO_LARGE"],
    ["query cursor tự nghĩ", async () => call(MAIN(), "GET", "/api/orders?cursor=abc", { token: await login(MAIN(), "khachle@example.com") }), 400, "VALIDATION_FAILED"],
    ["limit âm", async () => call(MAIN(), "GET", "/api/orders?limit=-1", { token: await login(MAIN(), "khachle@example.com") }), 400],
    ["ký tự NUL trong đường dẫn", () => call(MAIN(), "GET", "/api/products/%00"), 400],
    ["thiếu Idempotency-Key", async () => call(MAIN(), "POST", "/api/orders", { token: await login(MAIN(), "khachle@example.com"), body: { addressId: "500", deliveryDate: "2026-10-30", deliverySlot: "08:00-11:00", paymentOption: "cod" } }), 400],
  ];
  const cases = rows.map(([name, run, status, code]) => ({ name, run, status, code }));

  it.each(cases)("$name", async ({ run, status, code }) => {
    expectCleanError(await run(), status, code);
  });

  it("dữ liệu địa chỉ: quá dài, số điện thoại sai, trường thừa đều bị chặn 400", async () => {
    const token = await login(MAIN(), "khachle@example.com");
    const base = { recipientName: "An", phone: "0987654321", addressLine: "1 Lê Lợi", ward: "P1", province: "HCM" };
    for (const bad of [
      { ...base, recipientName: "A".repeat(100_000) },
      { ...base, phone: "abc" },
      { ...base, userId: "301" },
      { ...base, addressLine: "" },
    ]) {
      expectCleanError(await call(MAIN(), "POST", "/api/me/addresses", { token, body: bad }), 400, "VALIDATION_FAILED");
    }
  });

  it("số lượng giỏ hàng: 0, quá nhỏ, quá lớn, quá nhiều chữ số thập phân, sai kiểu đều bị chặn 400", async () => {
    const token = await login(MAIN(), "khachle@example.com");
    for (const quantity of [0, 0.0001, 1e308, 10001, 2.5555, "2", null, -1]) {
      expectCleanError(await call(MAIN(), "PUT", "/api/cart/items/201", { token, body: { quantity } }), 400);
    }
  });
});

describe("Token giả và truy cập trái quyền", () => {
  it("token sai, cắt chữ ký, alg none, ký bằng thuật toán khác đều 401 kèm WWW-Authenticate", async () => {
    const good = await login(MAIN(), "khachle@example.com");
    const [h, p] = good.split(".");
    const tokens = [
      "abc.def.ghi",
      `${h}.${p}.`,
      `${b64({ alg: "none", typ: "JWT" })}.${b64(goodClaims())}.`,
      `${h}.${b64(goodClaims({ sub: "202", roles: ["platform_owner"] }))}.${good.split(".")[2]}`,
      forge("dev-only-secret", goodClaims(), "HS512"),
    ];
    for (const token of tokens) {
      const res = await call(MAIN(), "GET", "/api/admin/settings", { token });
      expectCleanError(res, 401, "UNAUTHENTICATED");
      expect(res.headers.get("www-authenticate")).toContain("Bearer");
    }
  });

  it("production từ chối token ký bằng secret mặc định, hết hạn, sai issuer/audience", async () => {
    const attempts = [
      forge("dev-only-secret", goodClaims()),
      forge("sai-secret-sai-secret-sai-secret-sai!", goodClaims()),
      forge(process.env.BB_PROD_SECRET ?? "x", goodClaims({ exp: now() - 10 })),
    ];
    for (const token of attempts) expectCleanError(await call(PROD(), "GET", "/api/admin/settings", { token }), 401, "UNAUTHENTICATED");
  });

  it("khách A không đọc, thanh toán, hủy được đơn của khách B (404), không vào được API nội bộ (403)", async () => {
    const a = await login(MAIN(), "khachle@example.com");
    const b = await login(MAIN(), "khachtuchoi@example.com");
    await call(MAIN(), "PUT", "/api/cart/items/201", { token: a, body: { quantity: 1 } });
    const quote = await call(MAIN(), "POST", "/api/checkout/quote", { token: a, body: { addressId: "500" } });
    const slot = quote.body.deliverySlots.find((s: { available: boolean }) => s.available);
    const order = await call(MAIN(), "POST", "/api/orders", {
      token: a,
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: { addressId: "500", deliveryDate: slot.date, deliverySlot: slot.slot, paymentOption: "prepaid" },
    });
    expect(order.status).toBe(201);
    for (const [method, path] of [["GET", ""], ["POST", "/pay"], ["POST", "/cancel"]] as const) {
      expectCleanError(await call(MAIN(), method, `/api/orders/${order.body.id}${path}`, { token: b }), 404);
    }
    for (const path of ["/api/admin/orders", "/api/admin/inventory/holdings", "/api/admin/settings"]) {
      expectCleanError(await call(MAIN(), "GET", path, { token: a }), 403, "FORBIDDEN_ROLE");
    }
    expectCleanError(await call(MAIN(), "PUT", "/api/admin/settings", { token: a, body: { shippingFee: 0 } }), 403);
    expect((await call(MAIN(), "GET", "/api/cart", { token: b })).body.items).toEqual([]); // giỏ không lẫn người
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    call(PROD(), "OPTIONS", "/api/orders", {
      headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,idempotency-key" },
    });

  it("chỉ nguồn được khai báo mới được phép; không bật credentials", async () => {
    const ok = await preflight(PROD_ORIGIN());
    expect(ok.headers.get("access-control-allow-origin")).toBe(PROD_ORIGIN());
    expect(ok.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("idempotency-key");
    expect(ok.headers.get("access-control-allow-credentials")).toBeNull();
    const evil = await preflight("https://evil.example");
    expect(evil.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("Giới hạn tần suất theo IP", () => {
  it("vượt ngưỡng /api/auth thì 429 problem+json kèm Retry-After; /health không bị tính", async () => {
    const statuses: number[] = [];
    let last: Reply | undefined;
    for (let i = 0; i < 8; i += 1) {
      last = await call(TIGHT(), "POST", "/api/auth/otp", { body: { email: "khong-ton-tai@example.com" } });
      statuses.push(last.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 404)).toBe(true);
    expect(statuses.slice(5).every((s) => s === 429)).toBe(true);
    expectCleanError(last as Reply, 429, "RATE_LIMITED");
    expect(Number(last?.headers.get("retry-after"))).toBeGreaterThan(0);
    for (let i = 0; i < 60; i += 1) expect((await call(TIGHT(), "GET", "/api/health")).status).toBe(200);
  });
});

describe("OTP chạy thật qua email (server kiểu production)", () => {
  it("email thật tới hộp thư, không lộ devCode; đăng nhập bằng mã trong email; mã dùng một lần", async () => {
    const email = "khachle@example.com";
    const otp = await call(PROD(), "POST", "/api/auth/otp", { body: { email } });
    expect(otp.status).toBe(200);
    expect(otp.body.devCode).toBeUndefined();
    const code = await otpFromMail(email);

    const wrong = await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code: code === "000000" ? "111111" : "000000" } });
    expectCleanError(wrong, 401, "OTP_INVALID");

    const login1 = await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code } });
    expect(login1.status).toBe(200);
    expect((await call(PROD(), "GET", "/api/me", { token: login1.body.accessToken })).body.roles).toEqual(["buyer_retail"]);
    expectCleanError(await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code } }), 401, "OTP_EXPIRED");
  });

  it("gửi lại quá nhanh bị 429 kèm Retry-After", async () => {
    const email = "kho@farmery.vn";
    expect((await call(PROD(), "POST", "/api/auth/otp", { body: { email } })).status).toBe(200);
    const again = await call(PROD(), "POST", "/api/auth/otp", { body: { email } });
    expectCleanError(again, 429, "RATE_LIMITED");
    expect(Number(again.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await mailCount(email)).toBe(1);
  });

  it("email lạ: production trả y như thành công và không gửi thư (không lộ tài khoản); demo trả 404", async () => {
    const email = "nguoi-la-1@example.com";
    const res = await call(PROD(), "POST", "/api/auth/otp", { body: { email } });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["challengeId", "expiresAt"]);
    expect(await mailCount(email)).toBe(0);
    expect((await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: res.body.challengeId, code: "123456" } })).status).toBe(401);
    expect((await call(MAIN(), "POST", "/api/auth/otp", { body: { email } })).status).toBe(404);
  });

  it("nhập sai nhiều lần thì khóa đăng nhập bằng email đó, kể cả khi sau đó nhập đúng mã", async () => {
    const email = "chu@farmery.vn";
    const otp = await call(PROD(), "POST", "/api/auth/otp", { body: { email } });
    const code = await otpFromMail(email);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i += 1) {
      expectCleanError(await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code: wrong } }), 401, "OTP_INVALID");
    }
    const locked = await call(PROD(), "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code } });
    expectCleanError(locked, 429, "RATE_LIMITED");
    expect(Number(locked.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
