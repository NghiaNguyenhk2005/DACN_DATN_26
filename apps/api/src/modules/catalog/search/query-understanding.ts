import type { Schema } from "@farmery/contract";
import { levenshteinDistance } from "../utils/vietnamese-search.util";

export type SearchInterpretation = Schema<"SearchInterpretation">;

/** Vùng trồng của vùng thí điểm theo địa giới từ 1/7/2025; khớp hằng số bộ lọc của shop (`apps/shop/src/lib/filters.ts`). */
export const PILOT_REGIONS = ["Đà Lạt", "Lang Biang", "Đơn Dương", "Hiệp Thạnh"];

/** Tên cũ người dùng còn quen gọi → vùng theo địa giới mới. */
const REGION_ALIASES: [string, string][] = [
  ["lac duong|langbiang", "Lang Biang"],
  ["duc trong|hiep an", "Hiệp Thạnh"],
];

/** Bỏ dấu từng ký tự, giữ nguyên độ dài để vị trí khớp trên chuỗi bỏ dấu dùng lại được cho chuỗi gốc. */
export function fold(text: string): string {
  return text
    .normalize("NFC")
    .split("")
    .map((c) => (c === "đ" || c === "Đ" ? "d" : c.normalize("NFD").charAt(0)))
    .join("")
    .toLowerCase();
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|tr|trieu|dong|vnd|d)?(?![a-z])`;
const W = (s: string) => String.raw`(?<![a-z0-9])(?:${s})(?![a-z])`;

function money(num: string, unit: string | undefined): number {
  const n = Number(num.replace(",", "."));
  if (unit === "tr" || unit === "trieu") return Math.round(n * 1_000_000);
  if (unit === "k" || unit === "nghin" || unit === "ngan") return Math.round(n * 1000);
  // "dưới 200" không ghi đơn vị: hiểu là nghìn đồng.
  return Math.round(n < 1000 ? n * 1000 : n);
}

type Rule = { re: RegExp; apply: (m: RegExpExecArray, out: SearchInterpretation) => void };

const CERTS: [string, Schema<"CertType">][] = [
  ["huu co|organic", "organic"],
  ["vietgap|viet gap", "VietGAP"],
  ["globalgap|global gap", "GlobalGAP"],
  ["ocop", "OCOP"],
  ["haccp", "HACCP"],
];

const RULES: Rule[] = [
  {
    re: new RegExp(`${W("tu")}\\s*${NUM}\\s*(?:den|toi|-)\\s*${NUM}`, "g"),
    apply: (m, o) => {
      o.minPrice = money(m[1]!, m[2]);
      o.maxPrice = money(m[3]!, m[4] ?? m[2]);
    },
  },
  { re: new RegExp(`${W("duoi|toi da|khong qua|re hon|<=?")}\\s*${NUM}`, "g"), apply: (m, o) => (o.maxPrice = money(m[1]!, m[2])) },
  { re: new RegExp(`${W("tren|tu|it nhat|>=?")}\\s*${NUM}`, "g"), apply: (m, o) => (o.minPrice = money(m[1]!, m[2])) },
  ...CERTS.map(([pattern, cert]): Rule => ({ re: new RegExp(W(pattern), "g"), apply: (_m, o) => (o.cert = cert) })),
  { re: new RegExp(W("con hang|san hang|co san"), "g"), apply: (_m, o) => (o.inStock = true) },
  { re: new RegExp(W("vao mua|dang mua|theo mua|chinh vu|dung mua"), "g"), apply: (_m, o) => (o.inSeason = true) },
  ...PILOT_REGIONS.map((region): Rule => ({ re: new RegExp(W(fold(region)), "g"), apply: (_m, o) => (o.region = region) })),
  ...REGION_ALIASES.map(([pattern, region]): Rule => ({ re: new RegExp(W(pattern), "g"), apply: (_m, o) => (o.region = region) })),
];

const FILLERS = new Set(["mua", "tim", "can", "loai", "gia", "khoang", "tai", "o", "cho", "toi", "minh", "voi", "hang", "tu"]);

/** Tách cụm lọc trong câu tìm ("dâu tây hữu cơ dưới 200k") thành bộ lọc; phần còn lại là từ khóa. */
export function interpretQuery(query: string): SearchInterpretation {
  const original = query.normalize("NFC").replace(/\s+/g, " ").trim();
  const folded = fold(original);
  const used = new Array<boolean>(original.length).fill(false);
  const found: { start: number; text: string }[] = [];
  const out: SearchInterpretation = { keywords: "", phrases: [] };

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(folded))) {
      const start = m.index;
      const end = start + m[0].length;
      if (used.slice(start, end).some(Boolean)) continue;
      used.fill(true, start, end);
      rule.apply(m, out);
      found.push({ start, text: original.slice(start, end).trim() });
    }
  }

  out.phrases = found.sort((a, b) => a.start - b.start).map((f) => f.text);
  out.keywords = [...original]
    .map((c, i) => (used[i] ? " " : c))
    .join("")
    .split(/\s+/)
    .filter((w) => w && !FILLERS.has(fold(w)))
    .join(" ");
  return out;
}

/**
 * Sửa lỗi gõ theo từ vựng (tên sản phẩm, danh mục): mỗi từ lạ thay bằng từ gần nhất trong khoảng cách cho phép.
 * Trả null khi không sửa được hoặc không cần sửa.
 */
export function correctQuery(keywords: string, vocabulary: Map<string, string>): string | null {
  const words = keywords.split(/\s+/).filter(Boolean);
  let changed = false;
  const fixed = words.map((w) => {
    const key = fold(w);
    if (vocabulary.has(key) || key.length < 3) return w;
    const limit = key.length <= 4 ? 1 : 2;
    let best: { word: string; d: number } | null = null;
    for (const [candidate, display] of vocabulary) {
      if (Math.abs(candidate.length - key.length) > limit) continue;
      const d = levenshteinDistance(key, candidate);
      if (d <= limit && (!best || d < best.d)) best = { word: display, d };
    }
    if (!best) return w;
    changed = true;
    return best.word;
  });
  return changed ? fixed.join(" ") : null;
}

/** Từ vựng bỏ dấu → dạng có dấu (chữ thường) từ các chuỗi nguồn. */
export function buildVocabulary(texts: string[]): Map<string, string> {
  const vocab = new Map<string, string>();
  for (const t of texts) {
    for (const raw of t.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (raw.length < 2 || /^\d+$/.test(raw)) continue;
      const key = fold(raw);
      if (!vocab.has(key)) vocab.set(key, raw);
    }
  }
  return vocab;
}
