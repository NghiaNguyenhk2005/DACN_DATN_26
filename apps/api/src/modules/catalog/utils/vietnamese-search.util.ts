/**
 * Chuẩn hóa chuỗi tiếng Việt: bỏ dấu thanh, chuyển đ/Đ thành d/D, về chữ thường và xóa khoảng trắng thừa.
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi ngắn
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Sử dụng 2 hàng luân phiên để tối ưu bộ nhớ và tránh lỗi noUncheckedIndexedAccess
  let prevRow: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  const currRow: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a.charAt(i - 1);

    for (let j = 1; j <= n; j++) {
      const bChar = b.charAt(j - 1);
      const cost = aChar === bChar ? 0 : 1;
      const delCost = (prevRow[j] ?? 0) + 1;
      const insCost = (currRow[j - 1] ?? 0) + 1;
      const subCost = (prevRow[j - 1] ?? 0) + cost;
      currRow[j] = Math.min(delCost, insCost, subCost);
    }

    prevRow = [...currRow];
  }

  return prevRow[n] ?? 0;
}

export interface MatchScoreResult {
  matched: boolean;
  score: number;
}

/**
 * So khớp chuỗi tìm kiếm bỏ dấu + gần đúng:
 * - Khớp trực tiếp không dấu (substring match): điểm cao nhất (100)
 * - Khớp dính liền không khoảng trắng (vd: "dautay" khớp "dau tay"): điểm cao (90)
 * - Khớp mọi token từ khóa: điểm 80
 * - Khớp gần đúng (fuzzy / Levenshtein <= 1-2 ký tự cho token): điểm 50
 */
export function matchSearchQuery(target: string, query: string): MatchScoreResult {
  if (!query || !query.trim()) {
    return { matched: true, score: 0 };
  }

  const normTarget = removeVietnameseTones(target);
  const normQuery = removeVietnameseTones(query);

  if (normTarget.includes(normQuery)) {
    return { matched: true, score: 100 };
  }

  const noSpaceTarget = normTarget.replace(/\s+/g, "");
  const noSpaceQuery = normQuery.replace(/\s+/g, "");
  if (noSpaceTarget.includes(noSpaceQuery)) {
    return { matched: true, score: 90 };
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const targetTokens = normTarget.split(/\s+/).filter(Boolean);

  let allTokensMatched = true;
  for (const qToken of queryTokens) {
    const hasMatch = targetTokens.some((tToken) => {
      if (tToken.includes(qToken) || qToken.includes(tToken)) return true;
      const maxDist = qToken.length <= 4 ? 1 : 2;
      return levenshteinDistance(qToken, tToken) <= maxDist;
    });

    if (!hasMatch) {
      allTokensMatched = false;
      break;
    }
  }

  if (allTokensMatched) {
    return { matched: true, score: 70 };
  }

  return { matched: false, score: 0 };
}
