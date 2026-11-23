import request from "supertest";
import type { TestApp } from "../support";
import type { EvalQuery } from "./queries";
import { renderTable, scoreQuery, summarize, type QueryResult, type Summary } from "./metrics";

/** Đi như shop: tách cụm lọc qua /search/suggest rồi gọi /products với từ khóa + bộ lọc; trả bảng và số tổng hợp. */
export async function runQueries(t: TestApp, queries: EvalQuery[]): Promise<{ table: string; summary: Summary; results: QueryResult[] }> {
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
  return { table: renderTable(scores, summary), summary, results };
}
