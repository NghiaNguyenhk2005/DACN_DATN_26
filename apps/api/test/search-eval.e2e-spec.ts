import { createTestApp, type TestApp } from "./support";
import { EVAL_QUERIES, HELDOUT_QUERIES, type EvalQuery } from "./search-eval/queries";
import type { Summary } from "./search-eval/metrics";
import { runQueries } from "./search-eval/runner";

/** Ngưỡng chặn hồi quy (đặt thấp hơn số đo được một biên nhỏ). */
const THRESHOLDS: Record<"main" | "heldout", Omit<Summary, "queries">> = {
  main: { precisionAt5: 0.95, recallAt10: 0.95, ndcgAt10: 0.9, mrr: 0.95, precisionAll: 0.9, outOfCatalogEmpty: 1 },
  heldout: { precisionAt5: 0.8, recallAt10: 0.85, ndcgAt10: 0.75, mrr: 0.85, precisionAll: 0.8, outOfCatalogEmpty: 0.3 },
};

describe("Bộ đánh giá tìm kiếm", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  const run = (queries: EvalQuery[]) => runQueries(t, queries);

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
