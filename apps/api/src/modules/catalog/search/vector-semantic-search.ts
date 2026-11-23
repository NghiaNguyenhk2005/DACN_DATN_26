import { Injectable, Logger } from "@nestjs/common";
import { EmbeddingProvider } from "../../../integrations/embedding-provider";
import { fuseRrf } from "./fusion";
import { ProductEmbeddingIndex } from "./product-embedding-index";
import type { SearchHit } from "./search-corpus";
import { ConceptSemanticSearch, SemanticSearch } from "./semantic-search";
import { fold } from "./text-match";
import { CONCEPT_WEIGHT, MAX_VECTOR_HITS, MIN_SIM } from "./vector-config";

const QUERY_CACHE_SIZE = 500;

/**
 * Bộ tìm ngữ nghĩa bằng vector BGE-M3 (FR12.3): nhúng câu tìm, lấy sản phẩm có cosine ≥ minSim. Chỉ mục chưa dựng xong
 * hoặc dịch vụ AI lỗi thì lùi về từ điển khái niệm. conceptWeight > 0 trộn thêm kết quả từ điển với trọng số đó
 * (câu trừu tượng thường có cosine thấp, từ điển giữ phần chính xác cho khái niệm đã biết).
 */
@Injectable()
export class VectorSemanticSearch extends SemanticSearch {
  private readonly logger = new Logger(VectorSemanticSearch.name);
  private readonly cache = new Map<string, Float32Array>();
  minSim = MIN_SIM;
  conceptWeight = CONCEPT_WEIGHT;

  constructor(
    private readonly index: ProductEmbeddingIndex,
    private readonly embedder: EmbeddingProvider,
    private readonly fallback: ConceptSemanticSearch,
  ) {
    super();
  }

  async rank(query: string): Promise<SearchHit[]> {
    this.index.ensureBuilt();
    if (!this.index.ready) return this.fallback.rank(query);
    let vector: Float32Array;
    try {
      vector = await this.queryVector(query);
    } catch (error) {
      this.logger.warn(`Nhúng câu tìm lỗi, dùng từ điển khái niệm: ${error instanceof Error ? error.message : String(error)}`);
      return this.fallback.rank(query);
    }
    const hits = this.index.nearest(vector, MAX_VECTOR_HITS, this.minSim).map((h) => ({ productId: h.productId, score: h.similarity }));
    if (this.conceptWeight <= 0) return hits;
    const concept = await this.fallback.rank(query);
    const ids = fuseRrf([
      { hits, weight: () => 1 },
      { hits: concept, weight: () => this.conceptWeight },
    ]);
    return ids.map((productId, i) => ({ productId, score: ids.length - i }));
  }

  private async queryVector(query: string): Promise<Float32Array> {
    const key = fold(query).replace(/\s+/g, " ").trim();
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key); // đưa lên cuối để giữ thứ tự LRU
      this.cache.set(key, cached);
      return cached;
    }
    const [vector] = await this.embedder.embed([query.trim()]);
    if (!vector) throw new Error("Dịch vụ nhúng không trả vector");
    this.cache.set(key, vector);
    if (this.cache.size > QUERY_CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string);
    return vector;
  }
}
