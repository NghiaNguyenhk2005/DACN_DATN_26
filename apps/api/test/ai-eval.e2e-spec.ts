import { HttpEmbeddingProvider, EmbeddingProvider } from "../src/integrations/embedding-provider";
import { ProductEmbeddingIndex } from "../src/modules/catalog/search/product-embedding-index";
import { SemanticSearch } from "../src/modules/catalog/search/semantic-search";
import { VectorSemanticSearch } from "../src/modules/catalog/search/vector-semantic-search";
import { EVAL_QUERIES, EXTENSION_QUERIES, HELDOUT_QUERIES } from "./search-eval/queries";
import type { Summary } from "./search-eval/metrics";
import { runQueries } from "./search-eval/runner";
import { runSimilar } from "./similar-eval/runner";
import request from "supertest";
import { createTestApp, type TestApp } from "./support";

// Đo trên dịch vụ AI thật, không chạy trong CI: AI_SERVICE_URL=http://127.0.0.1:8000 AI_SERVICE_TOKEN=... pnpm test -- ai-eval
// Chỉ in số đo (nDCG@10, P@5, R@10, câu ngoài danh mục trả rỗng) theo từng cấu hình để chọn MIN_SIM; ngưỡng đạt kiểm ở spec khác.
const describeReal = process.env.AI_SERVICE_URL ? describe : describe.skip;
const f = (x: number) => x.toFixed(2);
const cell = (a: Summary) => `${f(a.ndcgAt10)} | ${f(a.recallAt10)} | ${f(a.precisionAt5)} | ${f(a.outOfCatalogEmpty)}`;
const row = (name: string, a: Summary, b: Summary, c: Summary) => `| ${name} | ${cell(a)} | ${cell(b)} | ${cell(c)} |`;

describeReal("Đo tìm kiếm ngữ nghĩa với BGE-M3 thật", () => {
  let t: TestApp;
  let vector: VectorSemanticSearch;
  jest.setTimeout(600_000);

  beforeAll(async () => {
    const provider = new HttpEmbeddingProvider(process.env.AI_SERVICE_URL ?? "", process.env.AI_SERVICE_TOKEN ?? "", 15_000);
    t = await createTestApp([], (b) => b.overrideProvider(EmbeddingProvider).useValue(provider));
    await t.app.get(ProductEmbeddingIndex).whenBuilt();
    vector = t.app.get(SemanticSearch) as VectorSemanticSearch;
  });
  afterAll(() => t.app.close());

  it("độ trễ của /products?q= (câu mới, chưa có trong bộ nhớ đệm vector)", async () => {
    const queries = [...EVAL_QUERIES, ...HELDOUT_QUERIES, ...EXTENSION_QUERIES].map((x) => x.q);
    const timed = async () => {
      const ms: number[] = [];
      for (const q of queries) {
        const start = performance.now();
        await request(t.http()).get("/api/products").query({ q, limit: 100 }).expect(200);
        ms.push(performance.now() - start);
      }
      return ms.sort((a, b) => a - b);
    };
    const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.ceil(p * xs.length) - 1)] ?? 0;
    const cold = await timed();
    const warm = await timed();
    console.log(
      `Độ trễ /products?q= (${queries.length} câu): lần đầu p50 ${pct(cold, 0.5).toFixed(0)} ms, p95 ${pct(cold, 0.95).toFixed(0)} ms, max ${pct(cold, 1).toFixed(0)} ms; ` +
        `lần hai (đã có bộ nhớ đệm) p50 ${pct(warm, 0.5).toFixed(0)} ms, p95 ${pct(warm, 0.95).toFixed(0)} ms`,
    );
  });

  it("sản phẩm tương tự: Precision@5 và độ phủ", async () => {
    const r = await runSimilar(t);
    console.log(
      `Sản phẩm tương tự (${r.summary.products} sản phẩm): P@5 ${f(r.summary.precisionAt5)}, đủ 5 gợi ý ${f(r.summary.fullLists)}, còn hàng ${f(r.summary.inStock)}`,
    );
  });

  it("so các cấu hình", async () => {
    expect(t.app.get(ProductEmbeddingIndex).size).toBe(39);
    const lines = [
      "| Cấu hình | chính nDCG | R@10 | P@5 | ngoài DM rỗng | độc lập nDCG | R@10 | P@5 | ngoài DM rỗng | mở rộng nDCG | R@10 | P@5 | ngoài DM rỗng |",
      "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ];
    const configs: { name: string; minSim: number; conceptWeight: number }[] = [
      { name: "chỉ từ khóa (vector tắt)", minSim: 2, conceptWeight: 0 },
      { name: "từ khóa + từ điển khái niệm", minSim: 2, conceptWeight: 1 },
      ...[0.4, 0.45, 0.5, 0.55].flatMap((minSim) => [
        { name: `vector minSim=${minSim}`, minSim, conceptWeight: 0 },
        { name: `vector minSim=${minSim} + khái niệm 0,5`, minSim, conceptWeight: 0.5 },
      ]),
    ];
    for (const c of configs) {
      vector.minSim = c.minSim;
      vector.conceptWeight = c.conceptWeight;
      const main = await runQueries(t, EVAL_QUERIES);
      const held = await runQueries(t, HELDOUT_QUERIES);
      const ext = await runQueries(t, EXTENSION_QUERIES);
      lines.push(row(c.name, main.summary, held.summary, ext.summary));
    }
    console.log(lines.join("\n"));
  });
});
