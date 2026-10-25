import request from "supertest";
import { createTestApp, login, ADDRESS, addAddress, type TestApp } from "./support";

describe("Đăng nhập OTP, hồ sơ, sổ địa chỉ", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  it("gửi OTP trả 200 kèm devCode 123456, đăng nhập rồi đọc /me", async () => {
    const otp = await request(t.http()).post("/api/auth/otp").send({ email: "khachle@example.com" }).expect(200);
    expect(otp.body.devCode).toBe("123456");
    const res = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "123456" }).expect(200);
    expect(res.body.user.roles).toEqual(["buyer_retail"]);
    const me = await request(t.http()).get("/api/me").auth(res.body.accessToken, { type: "bearer" }).expect(200);
    expect(me.body).toMatchObject({ id: res.body.user.id, email: "khachle@example.com" });
  });

  it("sai mã trả 401; mã chỉ dùng được một lần; quá 10 phút thì hết hạn", async () => {
    const otp = await request(t.http()).post("/api/auth/otp").send({ email: "khachle@example.com" }).expect(200);
    const bad = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "000000" }).expect(401);
    expect(bad.body.code).toBe("OTP_INVALID");
    await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "123456" }).expect(200);
    const reused = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "123456" }).expect(401);
    expect(reused.body.code).toBe("OTP_EXPIRED");

    const late = await request(t.http()).post("/api/auth/otp").send({ email: "khachle@example.com" }).expect(200);
    t.clock.advanceMinutes(11);
    const expired = await request(t.http()).post("/api/auth/login").send({ challengeId: late.body.challengeId, code: "123456" }).expect(401);
    expect(expired.body.code).toBe("OTP_EXPIRED");
  });

  it("khóa challenge sau 5 lần nhập sai", async () => {
    const otp = await request(t.http()).post("/api/auth/otp").send({ email: "khachle@example.com" }).expect(200);
    for (let i = 0; i < 4; i += 1) {
      const r = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "111111" }).expect(401);
      expect(r.body.code).toBe("OTP_INVALID");
    }
    const fifth = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "111111" }).expect(401);
    expect(fifth.body.code).toBe("OTP_EXPIRED");
    await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: "123456" }).expect(401);
  });

  it("mỗi vai trò một tài khoản giả; email lạ trả 404; /me trả đúng email đã dùng để đăng nhập", async () => {
    const roles = async (email: string) => {
      const token = await login(t, email);
      return (await request(t.http()).get("/api/me").auth(token, { type: "bearer" }).expect(200)).body.roles as string[];
    };
    expect(await roles("seller@farmery.vn")).toEqual(["seller", "buyer_retail"]);
    expect(await roles("vanhanh@farmery.vn")).toEqual(["staff_operations"]);
    expect(await roles("kho@farmery.vn")).toEqual(["staff_warehouse"]);
    expect(await roles("thumua@farmery.vn")).toEqual(["staff_sourcing"]);
    expect(await roles("hotro@farmery.vn")).toEqual(["staff_support"]);
    expect(await roles("chu@farmery.vn")).toEqual(["platform_owner"]);
    expect(await roles("staff@example.com")).toContain("staff_moderation");
    expect(await roles("nongdan@example.com")).toEqual(["seller", "buyer_retail"]);
    await request(t.http()).post("/api/auth/otp").send({ email: "nguoi-la@example.com" }).expect(404);

    const alias = await login(t, "buyer@farmery.vn");
    const me = await request(t.http()).get("/api/me").auth(alias, { type: "bearer" }).expect(200);
    expect(me.body.email).toBe("buyer@farmery.vn");
  });

  it("/me không có token trả 401", async () => {
    await request(t.http()).get("/api/me").expect(401);
  });

  it("sổ địa chỉ: địa chỉ đầu là mặc định, địa chỉ mới đặt mặc định thì thay; chỉ khách lẻ được gọi", async () => {
    const buyer = await login(t, "khachle@example.com");
    const seeded = await request(t.http()).get("/api/me/addresses").auth(buyer, { type: "bearer" }).expect(200);
    expect(seeded.body).toEqual([expect.objectContaining({ id: "500", isDefault: true, province: "TP. Hồ Chí Minh" })]);
    const first = await addAddress(t, buyer);
    const second = await request(t.http()).post("/api/me/addresses").auth(buyer, { type: "bearer" }).send({ ...ADDRESS, label: "Cơ quan", isDefault: true }).expect(201);
    const list = await request(t.http()).get("/api/me/addresses").auth(buyer, { type: "bearer" }).expect(200);
    expect(list.body.map((a: { id: string; isDefault: boolean }) => [a.id, a.isDefault])).toEqual([[second.body.id, true], [first, false], ["500", false]]);

    const other = await login(t, "khachtuchoi@example.com");
    expect((await request(t.http()).get("/api/me/addresses").auth(other, { type: "bearer" }).expect(200)).body).toEqual([]);

    const staff = await login(t, "kho@farmery.vn");
    await request(t.http()).get("/api/me/addresses").auth(staff, { type: "bearer" }).expect(403);
    await request(t.http()).post("/api/me/addresses").auth(buyer, { type: "bearer" }).send({ recipientName: "A" }).expect(400);
  });
});
