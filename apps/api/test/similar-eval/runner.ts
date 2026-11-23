import request from "supertest";
import type { TestApp } from "../support";
import { SIMILAR_LABELS } from "./labels";

export interface SimilarScore {
  productId: string;
  returned: string[];
  /** Trúng / k, với k = min(5, số tương tự hợp lệ). */
  precisionAt5: number;
}

export interface SimilarSummary {
  products: number;
  precisionAt5: number;
  /** Tỷ lệ sản phẩm nhận đủ 5 gợi ý. */
  fullLists: number;
  /** Tỷ lệ gợi ý còn hàng (tồn khả dụng > 0). */
  inStock: number;
}

export async function runSimilar(t: TestApp): Promise<{ scores: SimilarScore[]; summary: SimilarSummary }> {
  const scores: SimilarScore[] = [];
  let shown = 0;
  let stocked = 0;
  for (const [productId, valid] of Object.entries(SIMILAR_LABELS)) {
    const res = await request(t.http()).get(`/api/products/${productId}`).expect(200);
    const similar = res.body.similar as { id: string; listing?: { available: number } | null }[];
    const rel = new Set(valid);
    const k = Math.min(5, rel.size);
    scores.push({
      productId,
      returned: similar.map((s) => s.id),
      precisionAt5: similar.slice(0, k).filter((s) => rel.has(s.id)).length / k,
    });
    shown += similar.length;
    stocked += similar.filter((s) => (s.listing?.available ?? 0) > 0).length;
  }
  const mean = scores.reduce((a, s) => a + s.precisionAt5, 0) / scores.length;
  return {
    scores,
    summary: {
      products: scores.length,
      precisionAt5: mean,
      fullLists: scores.filter((s) => s.returned.length >= 5).length / scores.length,
      inStock: shown ? stocked / shown : 1,
    },
  };
}
