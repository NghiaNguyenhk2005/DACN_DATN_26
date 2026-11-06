import type { SearchHit } from "./search-corpus";

export interface RankedList {
  hits: SearchHit[];
  /** Trọng số của từng kết quả trong danh sách này. */
  weight: (hit: SearchHit) => number;
}

/** Hằng số k của reciprocal rank fusion (giá trị chuẩn trong tài liệu gốc của RRF). */
export const RRF_K = 60;

/**
 * Hợp nhất nhiều danh sách xếp hạng bằng RRF có trọng số: điểm = Σ w / (k + hạng).
 * Kết quả cùng điểm trong một danh sách được cùng hạng; hòa điểm cuối thì giữ thứ tự xuất hiện.
 */
export function fuseRrf(lists: RankedList[], k = RRF_K): string[] {
  const total = new Map<string, number>();
  for (const { hits, weight } of lists) {
    let rank = 0;
    hits.forEach((hit, i) => {
      if (i === 0 || hit.score !== hits[i - 1]!.score) rank = i + 1;
      total.set(hit.productId, (total.get(hit.productId) ?? 0) + weight(hit) / (k + rank));
    });
  }
  return [...total.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
