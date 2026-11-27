import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { DemoResetRegistry } from "../src/core/demo-reset.registry";
import { InventoryService } from "../src/modules/inventory/inventory.service";
import type { OpenFromBatchInput } from "../src/modules/inventory/stock.types";

// Chỉ chạy khi có PostgreSQL đã migrate (job ci-pg: STORAGE=prisma, DATABASE_URL). Kiểm FOR UPDATE thật, không qua HTTP.
const describePg = process.env.STORAGE === "prisma" ? describe : describe.skip;

const LISTING = "990001";
const OTHER_LISTING = "990002";

function batch(batchId: string, listingId: string, quantity: number, bestBefore = "2030-01-10"): OpenFromBatchInput {
  return {
    batchId,
    batchCode: `TEST-${batchId}`,
    productId: "990001",
    listingId,
    productName: "Sản phẩm thử tải",
    saleUnit: "kg",
    quantity,
    harvestDate: "2030-01-01",
    bestBefore,
  };
}

describePg("InventoryRepository trên PostgreSQL (STORAGE=prisma)", () => {
  let app: INestApplication;
  let inventory: InventoryService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
    configureApp(app);
    await app.init();
    inventory = app.get(InventoryService);
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.get(DemoResetRegistry).resetAll();
  }, 30_000);

  async function holdingOf(batchId: string) {
    const [h] = await inventory.listHoldings({ batchId });
    if (!h) throw new Error(`không có dòng tồn của lô ${batchId}`);
    return h;
  }

  it("dữ liệu mẫu được nạp lại sau khi đặt lại, tin bán 201 có tồn", async () => {
    expect(await inventory.availableForListing("201")).toBeGreaterThan(0);
    expect((await inventory.availabilityByListing()).get("201")).toBe(await inventory.availableForListing("201"));
  });

  it("mở dòng tồn từ lô là idempotent kể cả khi gọi đồng thời", async () => {
    await Promise.all([1, 2, 3, 4, 5].map(() => inventory.openFromBatch(batch("991001", LISTING, 8))));
    expect(await inventory.listHoldings({ batchId: "991001" })).toHaveLength(1);
    expect((await holdingOf("991001")).qtyOnHand).toBe(8);
  });

  it("giữ chỗ cả đơn hoặc không gì cả: một dòng thiếu hàng thì 409 và không đổi tồn", async () => {
    await inventory.openFromBatch(batch("991002", LISTING, 5));
    await inventory.openFromBatch(batch("991003", OTHER_LISTING, 1));
    await expect(
      inventory.reserve("990101", [
        { listingId: LISTING, quantity: 3 },
        { listingId: OTHER_LISTING, quantity: 2 },
      ]),
    ).rejects.toMatchObject({ code: "STOCK_CONFLICT" });
    expect((await holdingOf("991002")).qtyReserved).toBe(0);
    expect((await holdingOf("991003")).qtyReserved).toBe(0);
  });

  it("giữ chỗ trải qua nhiều lô theo FEFO và từ chối đơn trùng mã", async () => {
    await inventory.openFromBatch(batch("991004", LISTING, 2, "2030-01-05"));
    await inventory.openFromBatch(batch("991005", LISTING, 4, "2030-01-20"));
    const plan = await inventory.reserve("990102", [{ listingId: LISTING, quantity: 3 }]);
    expect(plan.map((p) => [p.batchId, p.quantity])).toEqual([
      ["991004", 2],
      ["991005", 1],
    ]);
    await expect(inventory.reserve("990102", [{ listingId: LISTING, quantity: 1 }])).rejects.toMatchObject({ code: "STOCK_CONFLICT" });
  });

  it("số lượng lẻ ba chữ số được giữ nguyên qua giữ chỗ, trừ tồn và hoàn tồn", async () => {
    await inventory.openFromBatch(batch("991006", LISTING, 1.5));
    await inventory.reserve("990103", [{ listingId: LISTING, quantity: 0.125 }]);
    expect(await holdingOf("991006")).toMatchObject({ qtyOnHand: 1.5, qtyReserved: 0.125 });
    await inventory.consume("990103");
    expect(await holdingOf("991006")).toMatchObject({ qtyOnHand: 1.375, qtyReserved: 0 });
    await inventory.returnIn("990103", "Khách trả");
    expect(await holdingOf("991006")).toMatchObject({ qtyOnHand: 1.5, qtyReserved: 0 });
  });

  it("nhả giữ chỗ trả lại tồn khả dụng; gọi lại hoặc khép sai trạng thái không làm gì", async () => {
    await inventory.openFromBatch(batch("991007", LISTING, 4));
    await inventory.reserve("990104", [{ listingId: LISTING, quantity: 3 }]);
    expect(await inventory.availableForListing(LISTING)).toBe(1);
    await inventory.release("990104", "Khách hủy");
    await inventory.release("990104", "Gọi lại");
    await inventory.consume("990104");
    expect(await inventory.availableForListing(LISTING)).toBe(4);
    const h = await holdingOf("991007");
    const types = (await inventory.listMovements(h.id)).map((m) => m.movementType);
    expect(types).toEqual(["release", "reserve", "open_from_batch"]);
  });

  it("50 yêu cầu đồng thời trên tồn 8: không bán vượt và tồn giữ chỗ khớp tổng đơn nhận", async () => {
    await inventory.openFromBatch(batch("991008", LISTING, 8));
    const wants = Array.from({ length: 50 }, (_, i) => 1 + (i % 4));
    const results = await Promise.allSettled(
      wants.map((q, i) => inventory.reserve(String(990200 + i), [{ listingId: LISTING, quantity: q }])),
    );
    let acceptedQty = 0;
    results.forEach((r, i) => {
      if (r.status === "fulfilled") acceptedQty += wants[i] ?? 0;
      else expect(r.reason).toMatchObject({ code: "STOCK_CONFLICT" });
    });
    const h = await holdingOf("991008");
    expect(acceptedQty).toBeLessThanOrEqual(8);
    expect(acceptedQty).toBeGreaterThan(0);
    expect(h.qtyReserved).toBe(acceptedQty);
    expect(h.qtyReserved).toBeLessThanOrEqual(h.qtyOnHand);
  }, 60_000);

  it("nhiều đơn hai dòng giành hai tin bán theo thứ tự ngược nhau không khóa chéo", async () => {
    await inventory.openFromBatch(batch("991009", LISTING, 10));
    await inventory.openFromBatch(batch("991010", OTHER_LISTING, 10));
    const results = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) =>
        inventory.reserve(String(990400 + i), [
          { listingId: i % 2 === 0 ? LISTING : OTHER_LISTING, quantity: 1 },
          { listingId: i % 2 === 0 ? OTHER_LISTING : LISTING, quantity: 1 },
        ]),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    for (const r of results) if (r.status === "rejected") expect(r.reason).toMatchObject({ code: "STOCK_CONFLICT" });
    expect(ok).toBe(10);
    expect((await holdingOf("991009")).qtyReserved).toBe(10);
    expect((await holdingOf("991010")).qtyReserved).toBe(10);
  }, 60_000);
});
