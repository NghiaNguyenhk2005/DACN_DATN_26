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

describe("E2E - Nhiệm vụ 16/10 (Catalog, Tìm kiếm, Chi tiết SP, Truy xuất, Hồ sơ NCC)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(() => app.close());

  describe("1. Danh mục (GET /api/categories)", () => {
    it("trả về cây danh mục sản phẩm từ mock data", async () => {
      const res = await request(app.getHttpServer()).get("/api/categories").expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe("Trái cây");
      expect(res.body[0].children?.length).toBeGreaterThan(0);
    });
  });

  describe("2. Tìm kiếm bỏ dấu + gần đúng (GET /api/products)", () => {
    it("tìm kiếm với q='dau tay' (không dấu) vẫn trả về Dâu tây", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/products")
        .query({ q: "dau tay" })
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);
      const first = res.body.items[0];
      expect(first.name).toContain("Dâu tây");
    });

    it("tìm kiếm với q='dautay' (viết liền không dấu) vẫn trả về Dâu tây", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/products")
        .query({ q: "dautay" })
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0].name).toContain("Dâu tây");
    });

    it("lọc theo region và cert", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/products")
        .query({ region: "Đà Lạt", cert: "VietGAP" })
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      for (const item of res.body.items) {
        expect(item.certifications).toContain("VietGAP");
        expect(item.supplier.growingRegion).toContain("Đà Lạt");
      }
    });

    it("lọc theo inSeason và khoảng giá minPrice, maxPrice", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/products")
        .query({ inSeason: true, minPrice: 100000, maxPrice: 200000 })
        .expect(200);

      for (const item of res.body.items) {
        expect(item.inSeason).toBe(true);
        if (item.listing) {
          expect(item.listing.unitPrice).toBeGreaterThanOrEqual(100000);
          expect(item.listing.unitPrice).toBeLessThanOrEqual(200000);
        }
      }
    });
  });

  describe("3. Chi tiết sản phẩm kèm tương tự (GET /api/products/{productId})", () => {
    it("lấy chi tiết sản phẩm thành công kèm batchesOnSale và similar", async () => {
      const res = await request(app.getHttpServer()).get("/api/products/1").expect(200);
      expect(res.body.id).toBe("1");
      expect(res.body.name).toBe("Dâu tây Hana Đà Lạt (Hộp 500g)");
      expect(res.body.description).toBeDefined();
      expect(res.body.batchesOnSale).toBeDefined();
      expect(Array.isArray(res.body.batchesOnSale)).toBe(true);
      expect(res.body.similar).toBeDefined();
      expect(Array.isArray(res.body.similar)).toBe(true);
    });

    it("trả về 404 khi sản phẩm không tồn tại", async () => {
      const res = await request(app.getHttpServer()).get("/api/products/99999").expect(404);
      expect(res.headers["content-type"]).toContain("application/problem+json");
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("4. Truy xuất công khai theo traceCode (GET /api/public/trace/{traceCode})", () => {
    it("truy xuất lô hợp lệ trả về đầy đủ TraceView và logs canh tác theo thời gian", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/public/trace/TRC-DTDL-2610-01")
        .expect(200);

      expect(res.body.traceCode).toBe("TRC-DTDL-2610-01");
      expect(res.body.product).toBeDefined();
      expect(res.body.product.name).toContain("Dâu tây Hana");
      expect(res.body.supplier).toBeDefined();
      expect(res.body.supplier.displayName).toBe("HTX Dâu tây Đà Lạt");
      expect(res.body.batch).toBeDefined();
      expect(res.body.batch.batchCode).toBe("DTDL-2610-01");
      expect(res.body.certifications.length).toBeGreaterThan(0);
      expect(res.body.logs.length).toBeGreaterThan(0);

      // Kiểm tra logs xếp theo thứ tự ngày tăng dần
      for (let i = 1; i < res.body.logs.length; i++) {
        expect(res.body.logs[i].activityDate >= res.body.logs[i - 1].activityDate).toBe(true);
      }
      expect(res.body.recall).toBeDefined();
      expect(res.body.recall.recalled).toBe(false);
    });

    it("trả về 404 khi traceCode không tồn tại", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/public/trace/TRC-KHONG-TON-TAI")
        .expect(404);

      expect(res.headers["content-type"]).toContain("application/problem+json");
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("5. Hồ sơ nhà cung cấp (GET /api/suppliers/{supplierId})", () => {
    it("lấy hồ sơ nhà cung cấp thành công kèm chứng nhận và danh sách sản phẩm", async () => {
      const res = await request(app.getHttpServer()).get("/api/suppliers/101").expect(200);

      expect(res.body.id).toBe("101");
      expect(res.body.displayName).toBe("HTX Dâu tây Đà Lạt");
      expect(res.body.growingRegion).toContain("Lâm Đồng");
      expect(res.body.avatarUrl).toContain("w=300");
      expect(res.body.certifications.length).toBeGreaterThan(0);
      expect(res.body.products.length).toBeGreaterThan(0);
      for (const p of res.body.products) {
        expect(p.supplier.id).toBe("101");
      }
    });

    it("trả về 404 khi supplierId không tồn tại", async () => {
      const res = await request(app.getHttpServer()).get("/api/suppliers/99999").expect(404);
      expect(res.headers["content-type"]).toContain("application/problem+json");
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
