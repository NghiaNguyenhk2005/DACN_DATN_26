import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { createSeed } from "@farmery/mock-data";
import type { Schema } from "@farmery/contract";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/core/app-config";
import { PRISMA_CLIENT, type PrismaClient } from "../src/core/prisma";

type Category = Schema<"Category">;

describe("Cấu hình kho dữ liệu (STORAGE)", () => {
  it("mặc định là memory và không cần DATABASE_URL", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.storage).toBe("memory");
    expect(config.databaseUrl).toBeNull();
  });

  it("từ chối giá trị lạ", () => {
    expect(() => loadConfig({ STORAGE: "mongo" })).toThrow("STORAGE phải là memory hoặc prisma");
  });

  it("STORAGE=prisma thiếu DATABASE_URL thì từ chối khởi động", () => {
    expect(() => loadConfig({ STORAGE: "prisma" })).toThrow("Thiếu DATABASE_URL");
  });

  it("STORAGE=prisma kèm DATABASE_URL được nhận", () => {
    const config = loadConfig({ STORAGE: "prisma", DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
    expect(config.storage).toBe("prisma");
    expect(config.databaseUrl).toBe("postgresql://u:p@localhost:5432/db");
  });
});

// Chỉ so id, tên, cờ lá và cây con: imageUrl không có cột lưu, productCount do CatalogService tính từ sản phẩm.
function strip(nodes: Category[]): Category[] {
  return nodes.map((n) => ({ id: n.id, name: n.name, isLeaf: n.isLeaf, children: strip(n.children) }));
}

// Chỉ chạy khi có PostgreSQL đã migrate + seed (job ci-pg: STORAGE=prisma, DATABASE_URL, pnpm db:migrate, pnpm db:seed).
const describePg = process.env.STORAGE === "prisma" ? describe : describe.skip;

describePg("CategoryRepository trên PostgreSQL (STORAGE=prisma)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  it("GET /api/categories trả cây danh mục giống dữ liệu mẫu đã seed", async () => {
    const res = await request(app.getHttpServer()).get("/api/categories").expect(200);
    expect(strip(res.body as Category[])).toEqual(strip(createSeed().categories));
  });

  it("migration tạo đủ 65 bảng ở 13 schema và ba extension", async () => {
    const prisma = app.get<PrismaClient>(PRISMA_CLIENT, { strict: false });
    const tables = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM information_schema.tables
      WHERE table_type = 'BASE TABLE' AND table_schema IN
        ('catalog','engagement','fulfillment','identity','inventory','media','notification','operations','payment','procurement','retail','supplier','wholesale')`;
    expect(tables[0]?.n).toBe(65);
    const ext = await prisma.$queryRaw<{ extname: string }[]>`SELECT extname FROM pg_extension`;
    expect(ext.map((e) => e.extname)).toEqual(expect.arrayContaining(["vector", "unaccent", "pg_trgm"]));
  });

  it("CHECK chặn tồn âm và giữ chỗ vượt tồn ở tầng dữ liệu", async () => {
    const prisma = app.get<PrismaClient>(PRISMA_CLIENT, { strict: false });
    const insert = (onHand: number, reserved: number) => prisma.$executeRaw`
      INSERT INTO inventory.stock_holdings (batch_id, owner_type, location_type, sale_unit, qty_on_hand, qty_reserved)
      VALUES (999999, 'supplier', 'farmery_warehouse', 'kg', ${onHand}, ${reserved})`;
    await expect(insert(-1, 0)).rejects.toThrow(/stock_holdings_qty_check/);
    await expect(insert(5, 6)).rejects.toThrow(/stock_holdings_qty_check/);
  });
});
