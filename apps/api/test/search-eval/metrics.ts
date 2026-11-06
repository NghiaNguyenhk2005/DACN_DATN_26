import type { EvalQuery } from "./queries";

export interface QueryResult {
  query: EvalQuery;
  returned: string[];
}

export interface QueryScore {
  q: string;
  group: string;
  returned: number;
  /** Trúng trong k đầu / k, với k = min(5, số liên quan). */
  precisionAt5: number;
  recallAt10: number;
  /** 1 / hạng của kết quả liên quan đầu tiên. */
  reciprocalRank: number;
  /** Số liên quan trả về / tổng số trả về (đo nhiễu). */
  precisionAll: number;
}

export function scoreQuery({ query, returned }: QueryResult): QueryScore {
  const rel = new Set(query.relevant);
  const k = Math.min(5, rel.size);
  const hitsAt = (n: number) => returned.slice(0, n).filter((id) => rel.has(id)).length;
  const firstHit = returned.findIndex((id) => rel.has(id));
  return {
    q: query.q,
    group: query.group,
    returned: returned.length,
    precisionAt5: k ? hitsAt(k) / k : 0,
    recallAt10: rel.size ? hitsAt(10) / rel.size : 0,
    reciprocalRank: firstHit >= 0 ? 1 / (firstHit + 1) : 0,
    precisionAll: returned.length ? hitsAt(returned.length) / returned.length : 0,
  };
}

export interface Summary {
  queries: number;
  precisionAt5: number;
  recallAt10: number;
  mrr: number;
  precisionAll: number;
  /** Tỷ lệ câu ngoài danh mục trả rỗng. */
  outOfCatalogEmpty: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summarize(scores: QueryScore[], results: QueryResult[]): Summary {
  const inCatalog = scores.filter((_, i) => results[i]!.query.relevant.length > 0);
  const outside = results.filter((r) => r.query.relevant.length === 0);
  return {
    queries: inCatalog.length,
    precisionAt5: mean(inCatalog.map((s) => s.precisionAt5)),
    recallAt10: mean(inCatalog.map((s) => s.recallAt10)),
    mrr: mean(inCatalog.map((s) => s.reciprocalRank)),
    precisionAll: mean(inCatalog.map((s) => s.precisionAll)),
    outOfCatalogEmpty: outside.length ? outside.filter((r) => r.returned.length === 0).length / outside.length : 1,
  };
}

const f = (x: number) => x.toFixed(2);

export function renderTable(scores: QueryScore[], summary: Summary): string {
  const rows = scores.map(
    (s) => `| ${s.group} | ${s.q} | ${s.returned} | ${f(s.precisionAt5)} | ${f(s.recallAt10)} | ${f(s.reciprocalRank)} | ${f(s.precisionAll)} |`,
  );
  return [
    "| Nhóm | Câu | Trả về | P@5 | R@10 | RR | P(toàn bộ) |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    "",
    `Trung bình ${summary.queries} câu trong danh mục: P@5 ${f(summary.precisionAt5)} · R@10 ${f(summary.recallAt10)} · ` +
      `MRR ${f(summary.mrr)} · P(toàn bộ) ${f(summary.precisionAll)} · ngoài danh mục trả rỗng ${f(summary.outOfCatalogEmpty)}`,
  ].join("\n");
}
