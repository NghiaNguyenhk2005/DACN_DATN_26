import request from "supertest";
import { EventBus } from "../src/core/events/event-bus";
import { EmbeddingProvider, EmbeddingUnavailableError, HashingEmbeddingProvider } from "../src/integrations/embedding-provider";
import { ProductRepository } from "../src/modules/catalog/product.repository";
import { ProductEmbeddingIndex } from "../src/modules/catalog/search/product-embedding-index";
import { ConceptSemanticSearch, SemanticSearch } from "../src/modules/catalog/search/semantic-search";
import { VectorSemanticSearch } from "../src/modules/catalog/search/vector-semantic-search";
import { SIMILAR_LABELS } from "./similar-eval/labels";
import { createTestApp, type TestApp } from "./support";

const DAU_TAY = ["1", "2", "3", "4"];
const waitFor = async (check: () => boolean | Promise<boolean>, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
};

describe("Tìm kiếm vector và sản phẩm tương tự (bộ nhúng băm)", () => {
  let t: TestApp;
  let index: ProductEmbeddingIndex;
  let search: VectorSemanticSearch;

  beforeAll(async () => {
    t = await createTestApp([], (b) => b.overrideProvider(EmbeddingProvider).useValue(new HashingEmbeddingProvider()));
    index = t.app.get(ProductEmbeddingIndex);
    await index.whenBuilt();
    search = t.app.get(SemanticSearch) as VectorSemanticSearch;
  });
  afterAll(() => t.app.close());

  it("có provider thì dùng bộ tìm vector và nhúng đủ sản phẩm công khai", () => {
    expect(search).toBeInstanceOf(VectorSemanticSearch);
    expect(index.ready).toBe(true);
    expect(index.size).toBe(Object.keys(SIMILAR_LABELS).length);
  });

  it("nhánh vector trả sản phẩm gần câu tìm, dưới ngưỡng thì không trả", async () => {
    search.conceptWeight = 0;
    const saved = search.minSim;
    try {
      search.minSim = 0.1;
      const hits = await search.rank("dâu tây Hana");
      expect(hits.length).toBeGreaterThan(0);
      expect(DAU_TAY).toContain(hits[0]?.productId);
      search.minSim = 0.99;
      expect(await search.rank("dâu tây Hana")).toEqual([]);
    } finally {
      search.minSim = saved;
      search.conceptWeight = 0.5;
    }
  });

  it("/products?q= vẫn trả đúng kết quả và 200 khi bật vector", async () => {
    const res = await request(t.http()).get("/api/products").query({ q: "dâu tây" }).expect(200);
    const ids = (res.body.items as { id: string }[]).map((p) => p.id);
    expect(ids.slice(0, 4).sort()).toEqual(DAU_TAY);
  });

  it("sản phẩm tương tự: tối đa 5, không gồm chính nó, không trùng, còn hàng, thuộc sản phẩm công khai", async () => {
    for (const id of ["1", "17", "29", "37"]) {
      const res = await request(t.http()).get(`/api/products/${id}`).expect(200);
      const ids = (res.body.similar as { id: string }[]).map((p) => p.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids.length).toBeLessThanOrEqual(5);
      expect(ids).not.toContain(id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const s of res.body.similar as { listing?: { available: number } | null }[]) expect(s.listing?.available ?? 1).toBeGreaterThan(0);
    }
  });

  it("nhúng lại sản phẩm khi nhận ProductChanged, không chặn bên phát", async () => {
    const products = t.app.get(ProductRepository);
    await products.update("1", { description: "zzxyzqword đặc biệt" });
    await t.app.get(EventBus).publish("ProductChanged", { productId: "1", change: "approved" });
    const [probe] = await new HashingEmbeddingProvider().embed(["zzxyzqword"]);
    const found = await waitFor(() => index.nearest(probe!, 1, 0.05)[0]?.productId === "1");
    expect(found).toBe(true);
  });
});

describe("Lùi về từ điển khái niệm", () => {
  it("không cấu hình dịch vụ AI thì dùng từ điển khái niệm và /products?q= vẫn chạy", async () => {
    const t = await createTestApp();
    try {
      expect(t.app.get(SemanticSearch)).toBeInstanceOf(ConceptSemanticSearch);
      expect(t.app.get(ProductEmbeddingIndex).enabled).toBe(false);
      const res = await request(t.http()).get("/api/products").query({ q: "rau sạch" }).expect(200);
      expect((res.body.items as unknown[]).length).toBeGreaterThan(0);
      const detail = await request(t.http()).get("/api/products/1").expect(200);
      expect((detail.body.similar as unknown[]).length).toBeGreaterThan(0);
    } finally {
      await t.app.close();
    }
  });

  it("dịch vụ AI lỗi thì không trả 5xx: tìm và gợi ý lùi về đường dự phòng", async () => {
    class Failing extends EmbeddingProvider {
      async embed(): Promise<Float32Array[]> {
        throw new EmbeddingUnavailableError("giả lập AI tắt");
      }
    }
    const t = await createTestApp([], (b) => b.overrideProvider(EmbeddingProvider).useValue(new Failing()));
    try {
      const index = t.app.get(ProductEmbeddingIndex);
      await index.whenBuilt();
      expect(index.ready).toBe(false);
      const res = await request(t.http()).get("/api/products").query({ q: "rau sạch" }).expect(200);
      expect((res.body.items as unknown[]).length).toBeGreaterThan(0);
      const detail = await request(t.http()).get("/api/products/1").expect(200);
      expect((detail.body.similar as unknown[]).length).toBeGreaterThan(0);
    } finally {
      await t.app.close();
    }
  });

  it("chỉ mục sẵn sàng nhưng nhúng câu tìm lỗi thì dùng từ điển khái niệm", async () => {
    let failing = false;
    class Flaky extends EmbeddingProvider {
      private readonly inner = new HashingEmbeddingProvider();
      async embed(texts: string[]): Promise<Float32Array[]> {
        if (failing) throw new EmbeddingUnavailableError("giả lập AI tắt giữa chừng");
        return this.inner.embed(texts);
      }
    }
    const t = await createTestApp([], (b) => b.overrideProvider(EmbeddingProvider).useValue(new Flaky()));
    try {
      await t.app.get(ProductEmbeddingIndex).whenBuilt();
      failing = true;
      const search = t.app.get(SemanticSearch) as VectorSemanticSearch;
      const concept = await t.app.get(ConceptSemanticSearch).rank("rau sạch");
      expect(concept.length).toBeGreaterThan(0);
      expect(await search.rank("rau sạch")).toEqual(concept);
    } finally {
      await t.app.close();
    }
  });
});
