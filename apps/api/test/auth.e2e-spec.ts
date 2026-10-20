import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
  configureApp(app);
  await app.init();
  return app;
}

describe("Đăng nhập OTP (/api/auth/otp, /api/auth/login, /api/me)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(() => app.close());

  it("gửi OTP, đăng nhập bằng devCode rồi đọc /me — đều trả 200 đúng hợp đồng", async () => {
    const otp = await request(app.getHttpServer())
      .post("/api/auth/otp")
      .send({ email: "staff@example.com" })
      .expect(200);
    expect(otp.body.challengeId).toEqual(expect.any(String));
    expect(otp.body.devCode).toBe("123456");

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ challengeId: otp.body.challengeId, code: otp.body.devCode })
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));

    const me = await request(app.getHttpServer())
      .get("/api/me")
      .auth(login.body.accessToken, { type: "bearer" })
      .expect(200);
    expect(me.body.id).toBe(login.body.user.id);
  });

  it("sai mã OTP trả 401", async () => {
    const otp = await request(app.getHttpServer())
      .post("/api/auth/otp")
      .send({ email: "staff@example.com" })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ challengeId: otp.body.challengeId, code: "000000" })
      .expect(401);
  });
});
