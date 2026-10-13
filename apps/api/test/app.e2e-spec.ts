import { Controller, Get, Post, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { Schema } from "@farmery/contract";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { TokenService } from "../src/core/token.service";

// Endpoint giả chỉ có trong test, để kiểm guard theo x-roles và Idempotency-Key trên thao tác thật của hợp đồng.
@Controller()
class ProbeController {
  private created = 0;

  @Post("seller/products")
  create(): Schema<"SellerProduct"> {
    this.created += 1;
    return { id: String(this.created), name: "Dâu tây", categoryId: "11", unit: "kg", status: "pending_review" };
  }

  @Get("admin/orders")
  listOrders(): { items: Schema<"OrderSummary">[]; nextCursor: string | null } {
    return { items: [], nextCursor: null };
  }
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
  configureApp(app);
  await app.init();
  return app;
}

describe("API khung", () => {
  let app: INestApplication;
  let sellerToken: string;

  beforeAll(async () => {
    app = await createApp();
    sellerToken = await app.get(TokenService).sign({ id: "201", roles: ["seller"] });
  });

  afterAll(() => app.close());

  it("GET /api/health trả trạng thái đúng hợp đồng", async () => {
    const res = await request(app.getHttpServer()).get("/api/health").expect(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/categories trả cây danh mục từ mock-data", async () => {
    const res = await request(app.getHttpServer()).get("/api/categories").expect(200);
    expect(res.body[0].name).toBe("Trái cây");
  });

  it("POST /api/dev/reset trả 204 khi DEMO_MODE", async () => {
    await request(app.getHttpServer()).post("/api/dev/reset").expect(204);
  });

  it("dữ liệu vào sai hợp đồng bị chặn bằng problem+json", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/otp").send({ email: "khong-phai-email" }).expect(400);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.body.code).toBe("VALIDATION_FAILED");
    expect(res.body.errors[0].field).toBe("/body/email");
  });

  it("đường dẫn ngoài hợp đồng trả 404, thao tác chưa làm trả 501", async () => {
    expect((await request(app.getHttpServer()).get("/api/khong-co").expect(404)).body.code).toBe("NOT_IN_CONTRACT");
    expect((await request(app.getHttpServer()).get("/api/cart").expect(501)).body.code).toBe("NOT_IMPLEMENTED");
  });

  it("thiếu token trả 401, sai vai trò trả 403", async () => {
    const anon = await request(app.getHttpServer()).get("/api/admin/orders").expect(401);
    expect(anon.body.code).toBe("UNAUTHENTICATED");
    const seller = await request(app.getHttpServer()).get("/api/admin/orders").auth(sellerToken, { type: "bearer" }).expect(403);
    expect(seller.body.code).toBe("FORBIDDEN_ROLE");
  });

  it("gửi lại cùng Idempotency-Key trả lại kết quả lần đầu", async () => {
    const body = { categoryId: "11", name: "Dâu tây", unit: "kg" };
    const send = (key: string) =>
      request(app.getHttpServer())
        .post("/api/seller/products")
        .auth(sellerToken, { type: "bearer" })
        .set("Idempotency-Key", key)
        .send(body)
        .expect(201);
    const first = await send("0b6f3c1e-8d0a-4a51-9a52-6f1f2b9c0d11");
    const again = await send("0b6f3c1e-8d0a-4a51-9a52-6f1f2b9c0d11");
    const other = await send("7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f");
    expect(again.body.id).toBe(first.body.id);
    expect(other.body.id).not.toBe(first.body.id);
  });
});

describe("khi tắt DEMO_MODE", () => {
  it("POST /api/dev/reset trả 404", async () => {
    process.env.DEMO_MODE = "false";
    const app = await createApp();
    try {
      expect((await request(app.getHttpServer()).post("/api/dev/reset").expect(404)).body.code).toBe("DEMO_MODE_OFF");
    } finally {
      delete process.env.DEMO_MODE;
      await app.close();
    }
  });
});
