/** Khớp văn bản tiếng Việt cho tìm kiếm: tách từ, bỏ dấu, khớp theo dấu, khoảng cách sửa lỗi. */

/** Bỏ dấu từng ký tự, giữ nguyên độ dài để vị trí khớp trên chuỗi bỏ dấu dùng lại được cho chuỗi gốc. */
export function fold(text: string): string {
  return text
    .normalize("NFC")
    .split("")
    .map((c) => (c === "đ" || c === "Đ" ? "d" : c.normalize("NFD").charAt(0)))
    .join("")
    .toLowerCase();
}

export interface Token {
  /** Chữ thường, giữ dấu. */
  raw: string;
  folded: string;
  /** Người dùng có gõ dấu: khi đó so có dấu ("đồ" khác "đỏ"). */
  toned: boolean;
}

export function tokenize(text: string): Token[] {
  return text
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((raw) => {
      const folded = fold(raw);
      return { raw, folded, toned: folded !== raw };
    });
}

const MIN_PREFIX = 3;

/** Từ câu tìm `q` khớp từ đích `t`: bằng nhau, hoặc `q` là tiền tố (từ ≥ 3 ký tự, cho lúc đang gõ dở). */
export function tokenMatches(q: Token, t: Token, allowPrefix = true): boolean {
  const [a, b] = q.toned ? [q.raw, t.raw] : [q.folded, t.folded];
  if (a === b) return true;
  return allowPrefix && a.length >= MIN_PREFIX && b.startsWith(a);
}

/** Mọi từ của câu khớp liền mạch, đúng thứ tự trong `target`; riêng từ cuối được khớp tiền tố nếu `allowPrefix`. */
export function containsPhrase(target: Token[], query: Token[], allowPrefix = true): boolean {
  if (!query.length || query.length > target.length) return false;
  for (let i = 0; i + query.length <= target.length; i++) {
    if (query.every((q, j) => tokenMatches(q, target[i + j]!, allowPrefix && j === query.length - 1))) return true;
  }
  return false;
}

/** Mọi từ của câu đều khớp một từ nào đó trong `target`. */
export function containsAllTokens(target: Token[], query: Token[], allowPrefix = true): boolean {
  return query.length > 0 && query.every((q) => target.some((t) => tokenMatches(q, t, allowPrefix)));
}

/** Khoảng cách sửa lỗi có tính đảo hai ký tự kề nhau ("lahc" → "lach" = 1). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[m]![n]!;
}

/** Số lỗi cho phép theo độ dài từ (đã bỏ dấu): từ ngắn phải đúng, vì phần lớn âm tiết tiếng Việt chỉ 2–4 ký tự. */
export function allowedTypos(length: number): number {
  if (length >= 7) return 2;
  if (length >= 3) return 1;
  return 0;
}

/**
 * Số lỗi khi khớp gần đúng từ `q` với `t`, bỏ qua dấu; `null` nếu vượt mức cho phép.
 * Dùng cho đường lùi khi tìm chính xác không ra gì.
 */
export function fuzzyTokenDistance(q: Token, t: Token): number | null {
  if (tokenMatches({ ...q, toned: false }, t)) return 0;
  const limit = allowedTypos(q.folded.length);
  if (!limit || Math.abs(q.folded.length - t.folded.length) > limit) return null;
  const d = editDistance(q.folded, t.folded);
  return d <= limit ? d : null;
}
