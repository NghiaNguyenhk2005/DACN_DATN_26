import { HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { ProblemException } from "../../core/problem";
import { CategoryRepository, type Category } from "./category.repository";
import {
  ProductRepository,
  type ProductDetail,
  type ProductCard,
  type ProductFilter,
  type ProductRecord,
  type ProductSearchResult,
} from "./product.repository";
import {
  BatchRepository,
  type Batch,
  type BatchFilter,
  type FarmingLog,
} from "./batch.repository";
import { SupplierService } from "../supplier/supplier.service";
import { OperationsService } from "../operations/operations.service";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { InventoryService } from "../inventory/inventory.service";
import type { AuthUser } from "../../core/token.service";
import { SemanticSearch } from "./search/semantic-search";
import { KeywordSearch } from "./search/keyword-search";
import { fuseRrf } from "./search/fusion";
import { containsAllTokens, fold, tokenize } from "./search/text-match";
import { buildVocabulary, correctQuery, interpretQuery, PILOT_REGIONS } from "./search/query-understanding";

export type TraceView = Schema<"TraceView">;
export type PublicFarmingLog = Schema<"PublicFarmingLog">;

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng "YYYY-MM-DD". */
function todayVN(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Ảnh chụp tin bán cho giỏ hàng: tên, giá, đơn vị tại thời điểm đọc. */
export interface ListingSnapshot {
  listingId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  saleUnit: string;
  unitPrice: number;
}

type WithListing = { listing?: Schema<"Listing"> | null };
type Freshness = Schema<"BatchFreshness">;

function withStock<T extends WithListing>(item: T, availability: Map<string, number>): T {
  if (!item.listing) return item;
  return { ...item, listing: { ...item.listing, available: availability.get(item.listing.id) ?? 0 } };
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
    private readonly batches: BatchRepository,
    @Inject(forwardRef(() => SupplierService))
    private readonly supplierService: SupplierService,
    @Inject(forwardRef(() => OperationsService))
    private readonly operationsService: OperationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly inventory: InventoryService,
    private readonly semantic: SemanticSearch,
    private readonly keyword: KeywordSearch,
  ) {}

  /** Cache idempotency đơn giản trong bộ nhớ; key = Idempotency-Key header, value = kết quả đã lưu. */
  private readonly idempotencyCache = new Map<string, { result: unknown; expiresAt: number }>();

  private idempotencyGet<T>(key: string | undefined): T | undefined {
    if (!key) return undefined;
    const entry = this.idempotencyCache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.idempotencyCache.delete(key); return undefined; }
    return entry.result as T;
  }

  private idempotencySet<T>(key: string | undefined, value: T): void {
    if (!key) return;
    // TTL 24 giờ
    this.idempotencyCache.set(key, { result: value, expiresAt: Date.now() + 86_400_000 });
  }

  /** Kiểm tra lô `batchId` thuộc nhà cung cấp đang đăng nhập; ném 403 nếu không phải. */
  private async assertBatchOwnership(batchId: string, batch: Batch, user?: AuthUser): Promise<void> {
    if (!user) return; // anonymous / staff sẽ không qua controller này
    // staff roles bỏ qua ownership check
    if (user.roles?.some((r) => r.startsWith("staff_"))) return;
    try {
      const supplierId = await this.supplierService.requireSupplierId(user.id);
      const ownProductIds = new Set((await this.products.findRecordsBySupplier(supplierId)).map((p) => p.id));
      if (!ownProductIds.has(batch.productId)) {
        throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", `Lô hàng ${batchId} không thuộc tài khoản của bạn`);
      }
    } catch (e) {
      if (e instanceof ProblemException) throw e;
      // requireSupplierId ném lỗi khi không tìm được nhà cung cấp → 403
      throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không tìm thấy hồ sơ nhà cung cấp cho tài khoản này");
    }
  }

  /** Cây danh mục kèm số sản phẩm đang bán (danh mục cha cộng cả danh mục con). */
  async listCategories(): Promise<Category[]> {
    const [tree, counts] = await Promise.all([this.categories.findTree(), this.products.countByCategory()]);
    const withCount = (c: Category): Category => {
      const children = c.children.map(withCount);
      const productCount = (counts[c.id] ?? 0) + children.reduce((sum, ch) => sum + (ch.productCount ?? 0), 0);
      return { ...c, productCount, children };
    };
    return tree.map(withCount);
  }

  /** Lô bán trước của từng sản phẩm: lô đã duyệt, chưa thu hồi, hạn sử dụng sớm nhất. */
  private async freshnessByProduct(): Promise<Map<string, Freshness>> {
    const approved = await this.batches.findBatches({ status: "approved" });
    const map = new Map<string, Freshness>();
    for (const b of approved) {
      if (b.recalledAt) continue;
      const cur = map.get(b.productId);
      if (!cur || b.bestBefore < cur.bestBefore) map.set(b.productId, { harvestDate: b.harvestDate, bestBefore: b.bestBefore });
    }
    return map;
  }

  private withFreshness<T extends ProductCard>(cards: T[], freshness: Map<string, Freshness>): T[] {
    return cards.map((c) => ({ ...c, saleBatch: freshness.get(c.id) ?? null }));
  }

  // Lượng còn bán được lấy từ dòng tồn (inventory), không dùng số tĩnh trong dữ liệu mẫu.
  async searchProducts(rawFilter: ProductFilter): Promise<ProductSearchResult> {
    const filter: ProductFilter = rawFilter.q?.trim() ? { ...rawFilter, rankedIds: await this.rankByQuery(rawFilter.q) } : rawFilter;
    const [availability, freshness] = await Promise.all([this.inventory.availabilityByListing(), this.freshnessByProduct()]);
    if (filter.inStock === undefined) {
      const result = await this.products.search(filter);
      return { ...result, items: this.withFreshness(result.items.map((c) => withStock(c, availability)), freshness) };
    }

    // Lọc "còn hàng" theo tồn thật: lấy hết kết quả khớp, lọc rồi phân trang lại.
    const { inStock, cursor, limit, ...rest } = filter;
    const matched: ProductSearchResult["items"] = [];
    let next: string | undefined;
    do {
      const page = await this.products.search({ ...rest, cursor: next, limit: 100 });
      matched.push(...page.items);
      next = page.nextCursor ?? undefined;
    } while (next);

    const filtered = matched
      .map((c) => withStock(c, availability))
      .filter((c) => (c.listing ? c.listing.available > 0 : false) === inStock);
    const pageSize = limit && limit > 0 ? Math.min(limit, 100) : 20;
    const parsed = cursor ? parseInt(cursor, 10) : 0;
    const offset = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    return {
      items: this.withFreshness(filtered.slice(offset, offset + pageSize), freshness),
      nextCursor: offset + pageSize < filtered.length ? String(offset + pageSize) : null,
    };
  }

  /** Tin bán theo `listingId` cho giỏ hàng; null khi không có. */
  async getListing(listingId: string): Promise<ListingSnapshot | null> {
    const product = await this.products.findByListingId(listingId);
    if (!product?.listing) return null;
    return {
      listingId,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl ?? null,
      saleUnit: product.listing.saleUnit,
      unitPrice: product.listing.unitPrice,
    };
  }

  async getProduct(productId: string): Promise<ProductDetail> {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy sản phẩm với ID: ${productId}`,
      );
    }

    const batchesOnSale = await this.batches.findApprovedByProductId(productId);
    const categoryId = (product as { categoryId?: string }).categoryId ?? "";
    const similar = await this.products.findSimilar(categoryId, productId, 4);

    const [availability, freshness] = await Promise.all([this.inventory.availabilityByListing(), this.freshnessByProduct()]);
    return withStock(
      {
        ...product,
        wholesale: product.wholesale ?? null,
        saleBatch: freshness.get(product.id) ?? null,
        batchesOnSale:
          batchesOnSale.length > 0 ? batchesOnSale : product.batchesOnSale,
        similar: this.withFreshness(similar.map((c) => withStock(c, availability)), freshness),
      },
      availability,
    );
  }

  async getPublicTrace(traceCode: string): Promise<TraceView> {
    const batch = await this.batches.findByTraceCode(traceCode);
    if (!batch || batch.status !== "approved") {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        "Mã truy xuất không tồn tại hoặc lô hàng chưa được kiểm duyệt công khai",
      );
    }

    const product = await this.products.findById(batch.productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        "Không tìm thấy thông tin sản phẩm tương ứng với lô hàng",
      );
    }

    const certifications =
      await this.supplierService.getSupplierCertifications(product.supplier.id);
    const rawLogs = await this.batches.findFarmingLogsByBatchId(batch.id);

    const logs: PublicFarmingLog[] = rawLogs.map((l) => ({
      activityDate: l.activityDate,
      activity: l.activity,
      description: l.description ?? null,
      imageUrls: l.imageUrls ?? [],
      isCorrection: Boolean(l.supersedesId),
      superseded: Boolean(l.superseded),
      enteredOnBehalf: Boolean(l.enteredBy?.onBehalf),
    }));

    const isRecalled = Boolean(batch.recalledAt);
    const recall = {
      recalled: isRecalled,
      reason: isRecalled ? batch.rejectReason ?? "Lô hàng đã bị thu hồi" : null,
      recalledAt: batch.recalledAt ?? null,
    };

    return {
      traceCode: batch.traceCode ?? traceCode,
      product: {
        id: product.id,
        name: product.name,
        categoryName: product.categoryName ?? "",
        imageUrl: product.imageUrl ?? null,
      },
      supplier: product.supplier,
      batch: {
        batchCode: batch.batchCode,
        harvestDate: batch.harvestDate,
        bestBefore: batch.bestBefore,
      },
      certifications,
      logs,
      recall,
    };
  }

  getBatchById(batchId: string): Promise<Batch | null> {
    return this.batches.findById(batchId);
  }

  getFarmingLogsByBatchId(batchId: string): Promise<FarmingLog[]> {
    return this.batches.findFarmingLogsByBatchId(batchId);
  }

  private toSellerProduct(p: ProductRecord): Schema<"SellerProduct"> {
    return {
      id: p.id,
      name: p.name,
      categoryId: p.categoryId ?? "",
      unit: p.unit,
      status: p.status ?? "approved",
      imageUrl: p.imageUrl ?? null,
    };
  }

  async listSellerProducts(user?: AuthUser): Promise<Schema<"SellerProduct">[]> {
    const supplierId = await this.supplierService.requireSupplierId(user?.id);
    const records = await this.products.findRecordsBySupplier(supplierId);
    return records.map((p) => this.toSellerProduct(p));
  }

  /** Lô của nhà cung cấp đang đăng nhập (lọc theo sản phẩm của họ), mới nhất trước. */
  async listSellerBatches(filter: BatchFilter, user?: AuthUser): Promise<Batch[]> {
    const supplierId = await this.supplierService.requireSupplierId(user?.id);
    const own = new Set((await this.products.findRecordsBySupplier(supplierId)).map((p) => p.id));
    const batches = await this.batches.findBatches(filter);
    return batches.filter((b) => own.has(b.productId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private findCategory(tree: Category[], id: string): Category | null {
    for (const c of tree) {
      if (c.id === id) return c;
      const hit = this.findCategory(c.children, id);
      if (hit) return hit;
    }
    return null;
  }

  async createSellerProduct(user: AuthUser | undefined, input: Schema<"ProductInput">): Promise<Schema<"SellerProduct">> {
    const supplierId = await this.supplierService.requireSupplierId(user?.id);
    const category = this.findCategory(await this.categories.findTree(), input.categoryId);
    if (!category || !category.isLeaf) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", "Chọn một danh mục cụ thể (danh mục con).");
    }
    const certs = input.certifications ?? [];
    if (certs.length > 0) {
      const own = await this.supplierService.listSellerCertifications(user?.id);
      const declared = new Set(own.filter((c) => c.status !== "rejected").map((c) => c.type));
      const missing = certs.filter((c) => !declared.has(c));
      if (missing.length > 0) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "VALIDATION_FAILED",
          `Chưa khai báo chứng nhận ${missing.join(", ")}. Thêm chứng nhận trước khi gắn cho sản phẩm.`,
        );
      }
    }
    const profile = await this.supplierService.getSupplierProfile(supplierId);
    const created = await this.products.create({
      name: input.name.trim(),
      categoryId: category.id,
      categoryName: category.name,
      imageUrl: null,
      imageUrls: [],
      description: input.description?.trim() ?? "",
      unit: input.unit.trim(),
      ...(input.seasonality ? { seasonality: input.seasonality.trim() } : {}),
      inSeason: false,
      supplier: { id: profile.id, displayName: profile.displayName, growingRegion: profile.growingRegion },
      certifications: certs,
      listing: null,
      wholesale: null,
      batchesOnSale: [],
      similar: [],
      status: "pending_review",
      rejectReason: null,
      referenceRetailPrice: input.referenceRetailPrice ?? null,
    });
    await this.operationsService.createReviewTask("product", created.id, `Sản phẩm ${created.name} — ${profile.displayName}`);
    return this.toSellerProduct(created);
  }

  /** Dữ liệu cho màn duyệt sản phẩm (ReviewTaskDetail.product). */
  async getProductReview(productId: string): Promise<NonNullable<Schema<"ReviewTaskDetail">["product"]> | null> {
    const p = await this.products.findRecord(productId);
    if (!p) return null;
    return {
      product: {
        id: p.id,
        name: p.name,
        categoryId: p.categoryId ?? "",
        categoryName: p.categoryName ?? "",
        unit: p.unit,
        description: p.description || null,
        imageUrls: p.imageUrls,
        referenceRetailPrice: p.referenceRetailPrice ?? null,
        seasonality: p.seasonality ?? null,
        status: p.status ?? "approved",
      },
      supplier: p.supplier,
    };
  }

  async decideProduct(productId: string, approved: boolean, reason?: string): Promise<void> {
    await this.products.update(productId, {
      status: approved ? "approved" : "rejected",
      rejectReason: approved ? null : (reason ?? null),
    });
  }

  /** Gợi ý khi gõ + hiểu câu tìm (GET /search/suggest). */
  async suggest(q: string): Promise<Schema<"SearchSuggest">> {
    const interpretation = interpretQuery(q);
    const keywords = interpretation.keywords;
    const folded = fold(keywords);
    const tree = await this.categories.findTree();
    const flat: Category[] = tree.flatMap((c) => [c, ...c.children]);

    const result = keywords ? await this.searchProducts({ q: keywords, limit: 5 }) : { items: [] as ProductCard[] };
    const products = result.items.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl ?? null,
      unitPrice: p.listing?.unitPrice ?? null,
      saleUnit: p.listing?.saleUnit ?? null,
    }));
    const keywordTokens = tokenize(keywords);
    const categories = folded
      ? flat
          .filter((c) => containsAllTokens(tokenize(c.name), keywordTokens))
          .slice(0, 3)
          .map((c) => ({ id: c.id, name: c.name }))
      : [];
    const regions = folded ? PILOT_REGIONS.filter((r) => fold(r).includes(folded)).slice(0, 3) : [];

    let correction: string | null = null;
    if (keywords && products.length === 0) {
      const all = await this.products.search({ limit: 100 });
      const vocab = buildVocabulary([...all.items.map((p) => p.name), ...flat.map((c) => c.name)]);
      correction = correctQuery(keywords, vocab);
    }
    return { products, categories, regions, interpretation, correction };
  }

  async getSellerBatch(batchId: string, user?: AuthUser): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }
    await this.assertBatchOwnership(batchId, batch, user);
    return batch;
  }

  async createBatch(input: Schema<"BatchInput">, user?: AuthUser, idempotencyKey?: string): Promise<Batch> {
    // Idempotency: nếu đã xử lý cùng key → trả lại kết quả cũ
    const cached = this.idempotencyGet<Batch>(idempotencyKey);
    if (cached) return cached;

    const supplierId = user ? await this.supplierService.requireSupplierId(user.id) : undefined;
    const product = await this.products.findById(input.productId);
    if (!product) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        `Không tìm thấy sản phẩm với ID: ${input.productId}`,
      );
    }

    // Bảo mật: chỉ được tạo lô cho sản phẩm đã duyệt của chính mình
    if (supplierId) {
      const record = await this.products.findRecord(input.productId);
      if (!record || record.supplier?.id !== supplierId) {
        throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Sản phẩm không thuộc hồ sơ nhà cung cấp của bạn");
      }
      if ((record.status ?? "approved") !== "approved") {
        throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "PRODUCT_NOT_APPROVED", "Chỉ được khai báo lô cho sản phẩm đã được duyệt");
      }
    }

    if (input.bestBefore <= input.harvestDate) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        "Hạn sử dụng (bestBefore) phải sau ngày thu hoạch (harvestDate)",
      );
    }

    if (input.declaredQuantity <= 0) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        "Số lượng khai báo (declaredQuantity) phải lớn hơn 0",
      );
    }

    const initials =
      product.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 4)
        .join("") || "LO";
    const yymm = todayVN().slice(2, 7).replace("-", "");
    const existing = await this.batches.findBatches({ productId: product.id });
    const seq = String(existing.length + 1).padStart(2, "0");
    const batchCode = `${initials}-${yymm}-${seq}`;

    const id = String(Date.now());
    const now = new Date().toISOString();

    const batch: Batch = {
      id,
      batchCode,
      productId: product.id,
      productName: product.name,
      harvestDate: input.harvestDate,
      bestBefore: input.bestBefore,
      declaredQuantity: input.declaredQuantity,
      status: "pending_review",
      rejectReason: null,
      traceCode: null,
      traceUrl: null,
      recalledAt: null,
      createdAt: now,
    };

    const created = await this.batches.createBatch(batch);
    await this.operationsService.createBatchReviewTask(created);
    this.idempotencySet(idempotencyKey, created);
    return created;
  }

  async listFarmingLogs(batchId: string, user?: AuthUser): Promise<FarmingLog[]> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }
    await this.assertBatchOwnership(batchId, batch, user);
    return this.batches.findFarmingLogsByBatchId(batchId);
  }

  async appendFarmingLog(
    batchId: string,
    input: Schema<"FarmingLogInput">,
    user?: AuthUser,
    idempotencyKey?: string,
  ): Promise<FarmingLog> {
    // Idempotency: trả lại kết quả cũ nếu đã xử lý
    const cached = this.idempotencyGet<FarmingLog>(idempotencyKey);
    if (cached) return cached;

    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }
    await this.assertBatchOwnership(batchId, batch, user);

    const today = todayVN(); // YYYY-MM-DD theo giờ Việt Nam
    if (input.activityDate > today) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "BATCH_DATE_INVALID",
        "Ngày hoạt động (activityDate) không được ở tương lai",
      );
    }

    if (input.supersedesId) {
      const oldLog = await this.batches.findFarmingLogById(input.supersedesId);
      if (!oldLog || oldLog.batchId !== batchId) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOG_SUPERSEDES_INVALID",
          "Bản ghi nhật ký cần đính chính không tồn tại hoặc không thuộc cùng lô hàng",
        );
      }
      // Chặn đính chính một dòng hai lần
      if (oldLog.superseded) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOG_ALREADY_SUPERSEDED",
          "Dòng nhật ký này đã được đính chính rồi. Không thể đính chính thêm lần nữa.",
        );
      }
      await this.batches.markFarmingLogSuperseded(input.supersedesId);
    }

    const isStaff = user?.roles?.some((r) => r.startsWith("staff_")) ?? false;
    const now = new Date().toISOString();

    const newLog: FarmingLog = {
      id: String(Date.now()),
      batchId,
      activityDate: input.activityDate,
      activity: input.activity,
      description: input.description ?? null,
      imageUrls: input.imageIds
        ? input.imageIds.map((id) => `http://localhost:4000/api/media/${id}`)
        : [],
      supersedesId: input.supersedesId ?? null,
      superseded: false,
      enteredBy: {
        userId: user?.id ?? "201",
        displayName: isStaff
          ? "Nhân viên hỗ trợ vùng"
          : "Người đại diện nhà cung cấp",
        onBehalf: isStaff,
      },
      createdAt: now,
    };

    const result = await this.batches.appendFarmingLog(newLog);
    this.idempotencySet(idempotencyKey, result);
    return result;
  }

  async approveBatch(batchId: string): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }

    const traceCode = batch.traceCode ?? `TRC-${batch.batchCode}`;
    const shopOrigin = this.config.corsOrigins[0] ?? "http://localhost:3000";
    const traceUrl = `${shopOrigin}/truy-xuat/${traceCode}`;

    const updated = await this.batches.updateBatch(batchId, {
      status: "approved",
      rejectReason: null,
      traceCode,
      traceUrl,
    });

    // Lô được duyệt thì có hàng để bán: mở dòng tồn của Farmery bằng số lượng khai báo.
    const product = await this.products.findById(batch.productId);
    if (product?.listing) {
      await this.inventory.openFromBatch({
        batchId: batch.id,
        batchCode: batch.batchCode,
        productId: product.id,
        listingId: product.listing.id,
        productName: batch.productName,
        saleUnit: product.listing.saleUnit,
        quantity: batch.declaredQuantity,
        harvestDate: batch.harvestDate,
        bestBefore: batch.bestBefore,
      });
    }
    return updated!;
  }

  async rejectBatch(batchId: string, reason: string): Promise<Batch> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        `Không tìm thấy lô hàng với ID: ${batchId}`,
      );
    }

    const updated = await this.batches.updateBatch(batchId, {
      status: "rejected",
      rejectReason: reason,
      traceCode: null,
      traceUrl: null,
    });
    return updated!;
  }
}
