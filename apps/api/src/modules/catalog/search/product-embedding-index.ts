import { createHash } from "node:crypto";
import { Inject, Injectable, Logger, Optional, type OnModuleInit } from "@nestjs/common";
import type { DomainEvent } from "../../../core/events/events";
import { OnDomainEvent } from "../../../core/events/on-domain-event";
import { EventBus } from "../../../core/events/event-bus";
import { EmbeddingProvider } from "../../../integrations/embedding-provider";
import { CategoryRepository } from "../category.repository";
import { ProductRepository, type ProductRecord } from "../product.repository";
import { MIN_SIM_SIMILAR } from "./vector-config";

export interface VectorHit {
  productId: string;
  similarity: number;
}

const BATCH = 32;
const RETRY_AFTER_MS = 30_000;
const CERT_LABELS: Record<string, string> = { organic: "hữu cơ organic" };

/**
 * Chỉ mục vector sản phẩm công khai trong bộ nhớ (FR12.1, FR12.3): văn bản mỗi sản phẩm nhúng qua EmbeddingProvider,
 * giữ kèm mã băm để chỉ nhúng lại khi văn bản đổi. Chưa có provider hoặc dịch vụ AI lỗi thì không sẵn sàng.
 */
@Injectable()
export class ProductEmbeddingIndex implements OnModuleInit {
  private readonly logger = new Logger(ProductEmbeddingIndex.name);
  private readonly entries = new Map<string, { hash: string; vector: Float32Array }>();
  /** Ngưỡng cosine giữa hai sản phẩm để gợi ý tương tự; đổi được lúc chạy cho bộ đo. */
  minSimSimilar = MIN_SIM_SIMILAR;
  private building: Promise<void> | null = null;
  private lastAttempt = 0;
  private builtOnce = false;

  constructor(
    @Optional() @Inject(EmbeddingProvider) private readonly embedder: EmbeddingProvider | null,
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly events: EventBus,
  ) {}

  onModuleInit(): void {
    this.ensureBuilt();
  }

  /** Có provider để nhúng hay không (thiếu thì mọi chỗ dùng chỉ mục lùi về đường dự phòng). */
  get enabled(): boolean {
    return this.embedder !== null && this.embedder !== undefined;
  }

  get ready(): boolean {
    return this.builtOnce;
  }

  get size(): number {
    return this.entries.size;
  }

  /** Dựng chỉ mục ở nền; gọi lại sau khi lần trước lỗi thì chỉ thử lại nếu đã quá RETRY_AFTER_MS. */
  ensureBuilt(): void {
    if (!this.enabled || this.builtOnce || this.building || Date.now() - this.lastAttempt < RETRY_AFTER_MS) return;
    this.lastAttempt = Date.now();
    this.building = this.build()
      .catch((error: unknown) => this.logger.warn(`Chưa dựng được chỉ mục vector: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => {
        this.building = null;
      });
  }

  /** Chờ lần dựng đang chạy xong (cho test và đo đạc). */
  async whenBuilt(): Promise<void> {
    this.ensureBuilt();
    await this.building;
  }

  /** Nhúng mọi sản phẩm công khai chưa có vector hoặc có văn bản đã đổi; bỏ vector của sản phẩm không còn công khai. */
  async build(): Promise<void> {
    const embedder = this.requireEmbedder();
    const records = await this.products.listPublicRecords();
    const texts = await this.textsOf(records);
    const stale = records.filter((r) => this.entries.get(r.id)?.hash !== hash(texts.get(r.id)!));
    for (let i = 0; i < stale.length; i += BATCH) {
      const chunk = stale.slice(i, i + BATCH);
      const vectors = await embedder.embed(chunk.map((r) => texts.get(r.id)!));
      chunk.forEach((r, j) => this.entries.set(r.id, { hash: hash(texts.get(r.id)!), vector: vectors[j]! }));
    }
    const live = new Set(records.map((r) => r.id));
    for (const id of [...this.entries.keys()]) if (!live.has(id)) this.entries.delete(id);
    this.builtOnce = true;
    for (const r of stale) void this.announce(r.id);
  }

  /** Nhúng lại một sản phẩm (đã đổi hoặc vừa duyệt); sản phẩm không công khai thì bỏ khỏi chỉ mục. */
  async refresh(productId: string): Promise<void> {
    if (!this.enabled || !this.builtOnce) return;
    const records = await this.products.listPublicRecords();
    const record = records.find((r) => r.id === productId);
    if (!record) {
      this.entries.delete(productId);
      return;
    }
    const text = (await this.textsOf([record])).get(productId)!;
    if (this.entries.get(productId)?.hash === hash(text)) return;
    const [vector] = await this.requireEmbedder().embed([text]);
    this.entries.set(productId, { hash: hash(text), vector: vector! });
    void this.announce(productId);
  }

  /** Cùng sự kiện với đường duyệt/đăng sản phẩm; không chờ nhúng xong để không kéo dài yêu cầu của người dùng. */
  @OnDomainEvent("ProductChanged")
  onProductChanged({ payload }: DomainEvent<"ProductChanged">): void {
    this.refresh(payload.productId).catch((error: unknown) =>
      this.logger.warn(`Chưa nhúng lại sản phẩm ${payload.productId}: ${error instanceof Error ? error.message : String(error)}`),
    );
  }

  /** Sản phẩm gần vector `query` nhất theo cosine (vector đã chuẩn hóa nên là tích vô hướng), từ `minSim` trở lên. */
  nearest(query: Float32Array, limit: number, minSim: number, exclude?: string): VectorHit[] {
    const hits: VectorHit[] = [];
    for (const [productId, { vector }] of this.entries) {
      if (productId === exclude) continue;
      const similarity = dot(query, vector);
      if (similarity >= minSim) hits.push({ productId, similarity });
    }
    return hits.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /** Láng giềng gần nhất của một sản phẩm đã có vector; rỗng nếu chưa có vector. */
  neighbors(productId: string, limit: number, minSim: number): VectorHit[] {
    const own = this.entries.get(productId);
    return own ? this.nearest(own.vector, limit, minSim, productId) : [];
  }

  private requireEmbedder(): EmbeddingProvider {
    if (!this.embedder) throw new Error("Chưa cấu hình dịch vụ nhúng");
    return this.embedder;
  }

  private async announce(productId: string): Promise<void> {
    try {
      await this.events.publish("ProductEmbedded", { productId, modelVersion: "bge-m3" });
    } catch (error) {
      this.logger.warn(`Phát ProductEmbedded lỗi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async textsOf(records: ProductRecord[]): Promise<Map<string, string>> {
    const tree = await this.categories.findTree();
    const parentOf = new Map<string, string>();
    for (const parent of tree) for (const child of parent.children) parentOf.set(child.id, parent.name);
    const out = new Map<string, string>();
    for (const p of records) {
      const parent = p.categoryId ? parentOf.get(p.categoryId) : undefined;
      const category = [parent, p.categoryName].filter(Boolean).join(" > ");
      const certs = p.certifications.map((c) => CERT_LABELS[c] ?? c).join(", ");
      const lines = [p.name, category, p.supplier?.growingRegion, certs, p.description].filter((x): x is string => Boolean(x));
      out.set(p.id, lines.join(". "));
    }
    return out;
  }
}

const hash = (text: string) => createHash("sha256").update(text).digest("hex");

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += (a[i] ?? 0) * (b[i] ?? 0);
  return sum;
}
