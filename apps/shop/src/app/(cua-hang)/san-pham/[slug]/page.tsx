import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Schema } from "@farmery/contract";
import { Breadcrumb, type Crumb } from "@/components/farmery/breadcrumb";
import { BuyBox } from "@/components/farmery/buy-box";
import { LotInfo } from "@/components/farmery/lot-info";
import { ProductCard } from "@/components/farmery/product-card";
import { ProductGallery } from "@/components/farmery/product-gallery";
import { ProductTabs } from "@/components/farmery/product-tabs";
import { TraceQr } from "@/components/farmery/trace-qr";
import { TraceTimeline } from "@/components/farmery/trace-timeline";
import { getCategories, getProduct, getSupplier, getTrace } from "@/lib/data";
import { formatDateVi, formatVnd } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";
import { categoryHref, parseSlugId, traceHref } from "@/lib/slug";

type Category = Schema<"Category">;

function findByName(tree: Category[], name: string, parent?: Category): Category[] | null {
  for (const c of tree) {
    if (c.name === name) return parent ? [parent, c] : [c];
    const hit = findByName(c.children, name, c);
    if (hit) return hit;
  }
  return null;
}

async function load(slug: string) {
  const id = parseSlugId(slug);
  return id ? getProduct(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/san-pham/[slug]">): Promise<Metadata> {
  const product = await load((await params).slug).catch(() => null);
  return { title: product?.name ?? "Sản phẩm" };
}

/**
 * Chi tiết sản phẩm. ≥lg: lưới [520px | 1fr | 300px], gap 32px.
 * <lg: một cột — ảnh full-width cao 300px, khung mua dính đáy.
 */
export default async function ProductPage({ params }: PageProps<"/san-pham/[slug]">) {
  const product = await load((await params).slug);
  if (!product) notFound();

  // Lô đang bán có hạn dùng sớm nhất: tab nhật ký và ô thông tin lô lấy theo lô này.
  const batch = [...product.batchesOnSale].sort((a, b) => a.bestBefore.localeCompare(b.bestBefore))[0];
  const [supplier, trace, categories, h] = await Promise.all([
    getSupplier(product.supplier.id).catch(() => null),
    batch ? getTrace(batch.traceCode).catch(() => null) : null,
    getCategories().catch(() => []),
    headers(),
  ]);
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const crumbs: Crumb[] = [{ label: "Trang chủ", href: "/" }];
  const path = product.categoryName ? findByName(categories, product.categoryName) : null;
  path?.forEach((c) => crumbs.push({ label: c.name, href: categoryHref(c) }));
  crumbs.push({ label: product.name });

  const { listing } = product;
  const certs = product.certifications.map((c) => CERT_LABELS[c]).join(" · ");

  return (
    <div className="pb-28 lg:pb-6">
      <div className="py-3 md:pb-0 md:pt-[18px]">
        <Breadcrumb items={crumbs} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)_300px] lg:gap-8 lg:pt-[18px]">
        <ProductGallery images={product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []} alt={product.name} />

        <div className="min-w-0">
          <h1 className="mb-2.5 font-serif text-[22px] font-bold leading-[1.3] text-ink md:text-h1">{product.name}</h1>
          <p className="mb-3 text-small text-muted-foreground">
            {product.supplier.displayName} · {product.supplier.growingRegion}
          </p>
          {listing ? (
            <>
              <p className="mb-1.5 flex items-baseline gap-2.5">
                <span className="text-[28px] font-bold leading-tight text-cta md:text-price-xl">
                  {formatVnd(listing.unitPrice)}
                </span>
                <span className="text-title text-muted-foreground">/ {listing.saleUnit}</span>
              </p>
              <p className="mb-[18px] text-caption text-muted-foreground">
                Giá đã gồm thuế GTGT ·{" "}
                {listing.available > 0 ? (
                  <>Còn {listing.available.toLocaleString("vi-VN")} {listing.saleUnit}</>
                ) : (
                  <span className="font-semibold text-danger">Tạm hết hàng</span>
                )}
              </p>
            </>
          ) : (
            <p className="mb-[18px] text-title font-semibold text-muted-foreground">Sản phẩm chưa mở bán</p>
          )}

          <div className="mb-5 md:mb-[22px]">
            <LotInfo
              facts={[
                { label: "Ngày thu hoạch", value: batch ? formatDateVi(batch.harvestDate) : "Chưa có lô" },
                { label: "Vùng trồng", value: product.supplier.growingRegion },
                { label: "Chứng nhận", value: certs || "Chưa có" },
                { label: "Hạn dùng", value: batch ? formatDateVi(batch.bestBefore) : (product.seasonality ?? "—") },
              ]}
            />
          </div>

          <ProductTabs
            description={<p className="whitespace-pre-line">{product.description}</p>}
            log={<TraceTab batch={batch} trace={trace} origin={origin} />}
          />
        </div>

        <BuyBox
          listing={listing}
          seller={{
            name: product.supplier.displayName,
            region: product.supplier.growingRegion,
            avatarUrl: supplier?.avatarUrl,
          }}
        />
      </div>

      {product.similar.length > 0 && (
        <section className="pt-10" aria-labelledby="tuong-tu">
          <h2 id="tuong-tu" className="mb-3 text-h2-sm font-bold text-ink md:mb-4 md:text-h2">
            Sản phẩm tương tự
          </h2>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5">
            {product.similar.map((p) => (
              <div key={p.id} className="grid w-[46%] flex-none md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TraceTab({
  batch,
  trace,
  origin,
}: {
  batch: Schema<"BatchOnSale"> | undefined;
  trace: Schema<"TraceView"> | null;
  origin: string;
}) {
  if (!batch) return <p className="text-small text-muted-foreground">Sản phẩm chưa có lô đang bán.</p>;
  const href = traceHref(batch.traceCode);
  const lastLog = trace?.logs.at(-1);

  return (
    <>
      <div className="mb-[18px] flex gap-4 md:gap-5">
        <div className="grid size-[110px] flex-none place-items-center rounded-tile border border-border p-2">
          <TraceQr value={`${origin}${href}`} />
        </div>
        <div className="min-w-0">
          <p className="mb-[5px] text-body font-bold text-ink">Mã lô {batch.batchCode}</p>
          <p className="max-w-[340px] text-caption leading-[1.6] text-muted-foreground">
            Quét mã trên tem dán ở thùng để mở đúng nhật ký này. Mọi đính chính đều được giữ lại và đánh dấu.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {trace?.recall.recalled ? (
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-micro font-semibold text-danger">Lô đã thu hồi</span>
            ) : (
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-micro font-semibold text-success">Lô hợp lệ</span>
            )}
            {lastLog && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-micro text-ink-2">
                Cập nhật {formatDateVi(lastLog.activityDate)}
              </span>
            )}
            <Link href={href} className="text-caption font-semibold">
              Mở trang truy xuất →
            </Link>
          </div>
        </div>
      </div>
      {trace ? (
        trace.logs.length > 0 ? (
          <TraceTimeline items={trace.logs} compact />
        ) : (
          <p className="text-small text-muted-foreground">Lô này chưa có nhật ký canh tác.</p>
        )
      ) : (
        <p role="alert" className="text-small text-danger">
          Không tải được nhật ký canh tác. Vui lòng mở trang truy xuất hoặc thử lại sau.
        </p>
      )}
    </>
  );
}
