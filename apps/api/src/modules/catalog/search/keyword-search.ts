import { Injectable } from "@nestjs/common";
import { SearchCorpus, type SearchDoc, type SearchHit } from "./search-corpus";
import { containsAllTokens, containsPhrase, fuzzyTokenDistance, tokenize, type Token } from "./text-match";

/**
 * Bộ tìm theo từ khóa (FR12.3, nhánh full-text). Bản nay chạy trong bộ nhớ;
 * bản Postgres (`unaccent` + trigram) thay lớp cài đặt, giữ interface.
 */
export abstract class KeywordSearch {
  abstract rank(query: string, options?: { fuzzy?: boolean }): Promise<SearchHit[]>;
}

/** Nơi khớp: chỉ lấy tầng tốt nhất có kết quả (tên → danh mục → mô tả) để kết quả yếu không lẫn vào. */
const Level = { Name: 3, Category: 2, Description: 1 } as const;
type Level = (typeof Level)[keyof typeof Level];

interface Match {
  score: number;
  level: Level;
}

function matchExact(doc: SearchDoc, q: Token[], compact: string | null): Match | null {
  const coverage = q.filter((t) => containsAllTokens(doc.name, [t])).length / q.length;
  if (containsPhrase(doc.name, q)) return { score: 100, level: Level.Name };
  if (compact && doc.nameCompact.includes(compact)) return { score: 90, level: Level.Name };
  if (containsAllTokens(doc.name, q)) return { score: 70, level: Level.Name };
  if (containsPhrase(doc.leafCategory, q)) return { score: 80 + coverage * 5, level: Level.Category };
  if (containsAllTokens([...doc.name, ...doc.leafCategory], q)) return { score: 70 + coverage * 5, level: Level.Category };
  if (containsPhrase(doc.description, q, false)) return { score: 40, level: Level.Description };
  return null;
}

/** Gần đúng: mọi từ phải khớp; ít lỗi hơn xếp trên ("bong cia" → "Bông cải" trước "Cải cầu vồng"). */
function matchFuzzy(doc: SearchDoc, q: Token[]): Match | null {
  const pool = [...doc.name, ...doc.leafCategory];
  let typos = 0;
  for (const qt of q) {
    const best = Math.min(...pool.map((t) => fuzzyTokenDistance(qt, t) ?? Infinity));
    if (best === Infinity) return null;
    typos += best;
  }
  return { score: 20 - typos, level: Level.Name };
}

@Injectable()
export class InMemoryKeywordSearch extends KeywordSearch {
  constructor(private readonly corpus: SearchCorpus) {
    super();
  }

  async rank(query: string, options: { fuzzy?: boolean } = {}): Promise<SearchHit[]> {
    const q = tokenize(query);
    if (!q.length) return [];
    // Gõ liền không khoảng trắng ("dautay"): chỉ xét khi câu là một từ đủ dài.
    const compact = q.length === 1 && q[0]!.folded.length >= 5 ? q[0]!.folded : null;
    const docs = await this.corpus.docs();

    const matches = docs
      .map((doc) => ({ doc, m: options.fuzzy ? matchFuzzy(doc, q) : matchExact(doc, q, compact) }))
      .filter((x): x is { doc: SearchDoc; m: Match } => x.m !== null);
    const best = Math.max(0, ...matches.map((x) => x.m.level));
    // Gần đúng: chỉ giữ kết quả ít lỗi nhất, tránh kéo theo các từ tình cờ giống.
    const topFuzzy = Math.max(-Infinity, ...matches.map((x) => x.m.score));
    return matches
      .filter((x) => x.m.level === best && (!options.fuzzy || x.m.score === topFuzzy))
      .sort((a, b) => b.m.score - a.m.score)
      .map((x) => ({ productId: x.doc.id, score: x.m.score }));
  }
}
