import request from "supertest";
import { createTestApp, type TestApp } from "./support";
import { EVAL_QUERIES, HELDOUT_QUERIES, type EvalQuery } from "./search-eval/queries";
import { renderTable, scoreQuery, summarize, type QueryResult, type Summary } from "./search-eval/metrics";

/** Ngưỡng chặn hồi quy (đặt thấp hơn số đo được một biên nhỏ). */
const THRESHOLDS: Record<"main" | "heldout", Omit<Summary, "queries">> = {
  main: { precisionAt5: 0.95, recallAt10: 0.95, mrr: 0.95, precisionAll: 0.9, outOfCatalogEmpty: 1 },
  heldout: { precisionAt5: 0.8, recallAt10: 0.85, mrr: 0.85, precisionAll: 0.8, outOfCatalogEmpty: 0.3 },
};

describe("Bộ đánh giá tìm kiếm", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  /** Đi như shop: tách cụm lọc qua /search/suggest rồi gọi /products với từ khóa + bộ lọc. */
  async function run(queries: EvalQuery[]): Promise<{ table: string; summary: Summary }> {
    const results: QueryResult[] = [];
    for (const query of queries) {
      const sug = await request(t.http()).get("/api/search/suggest").query({ q: query.q }).expect(200);
      const interp = sug.body.interpretation as Record<string, unknown> & { phrases: string[]; keywords: string };
      const params: Record<string, unknown> = { limit: 100 };
      if (interp.phrases.length > 0) {
        if (interp.keywords) params.q = interp.keywords;
        for (const k of ["cert", "region", "minPrice", "maxPrice", "inStock", "inSeason"]) {
          if (interp[k] !== undefined && interp[k] !== null) params[k] = interp[k];
        }
      } else {
        params.q = query.q;
      }
      const res = await request(t.http()).get("/api/products").query(params).expect(200);
      results.push({ query, returned: (res.body.items as { id: string }[]).map((p) => p.id) });
    }
    const scores = results.map(scoreQuery);
    const summary = summarize(scores, results);
    return { table: renderTable(scores, summary), summary };
  }

  const check = (summary: Summary, min: Omit<Summary, "queries">) => {
    for (const key of Object.keys(min) as (keyof typeof min)[]) {
      expect({ [key]: summary[key] >= min[key] }).toEqual({ [key]: true });
    }
  };

  it("bộ chính đạt ngưỡng", async () => {
    const { table, summary } = await run(EVAL_QUERIES);
    console.log(`Bộ chính\n${table}`);
    check(summary, THRESHOLDS.main);
  });

  it("bộ kiểm tra độc lập đạt ngưỡng", async () => {
    const { table, summary } = await run(HELDOUT_QUERIES);
    console.log(`Bộ kiểm tra độc lập\n${table}`);
    check(summary, THRESHOLDS.heldout);
  });
});
