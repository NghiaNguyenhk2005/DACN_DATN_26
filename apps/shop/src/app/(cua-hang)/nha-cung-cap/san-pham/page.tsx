import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Layers, Package, PlusCircle } from "lucide-react";
import { SafeImage } from "@/components/farmery/safe-image";
import { ReviewStatusBadge } from "@/components/farmery/status-badge";
import { getSellerBatches, getSellerProducts } from "@/lib/data/seller";

export const metadata: Metadata = { title: "Sản phẩm của tôi" };

/** Sản phẩm của nhà cung cấp (design/05 N5): ảnh, trạng thái, đơn vị bán, số lô; hành động Khai báo lô · Xem lô. */
export default async function SellerProductsPage({ searchParams }: PageProps<"/nha-cung-cap/san-pham">) {
  const created = (await searchParams)["thanh-cong"] === "1";
  const [products, batches] = await Promise.all([getSellerProducts(), getSellerBatches()]);

  return (
    <div className="flex flex-col gap-4">
      {created && (
        <p role="status" className="flex items-start gap-2.5 rounded-card border border-success-soft bg-success-soft px-4 py-3 text-small text-ink">
          <CheckCircle2 className="mt-0.5 size-5 flex-none text-success" aria-hidden />
          Đã gửi duyệt sản phẩm. Thường có kết quả trong 48 giờ; sản phẩm được duyệt mới dùng để khai báo lô.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-small text-ink-2">Sản phẩm đã duyệt dùng để khai báo lô thu hoạch.</p>
        <Link href="/nha-cung-cap/san-pham/tao-moi" className="text-small font-semibold md:hidden">
          + Đăng sản phẩm
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
          Chưa có sản phẩm nào. <Link href="/nha-cung-cap/san-pham/tao-moi">Đăng sản phẩm đầu tiên</Link> để bắt đầu.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const own = batches.filter((b) => b.productId === p.id);
            const onSale = own.filter((b) => b.status === "approved" && !b.recalledAt).length;
            return (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-card border border-line">
                <div className="flex gap-3.5 p-4">
                  <span className="relative grid size-16 flex-none place-items-center overflow-hidden rounded-tile bg-surface text-subtle">
                    {p.imageUrl ? (
                      <SafeImage src={p.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <Package className="size-7" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <ReviewStatusBadge status={p.status} />
                    <h3 className="mt-1.5 line-clamp-2 text-title font-semibold text-ink">{p.name}</h3>
                    <p className="mt-0.5 text-small text-ink-2">Đơn vị bán: {p.unit}</p>
                  </div>
                </div>
                <p className="flex justify-between border-t border-line px-4 py-2.5 text-small text-ink-2">
                  <span>
                    Tổng số lô <strong className="text-ink">{own.length}</strong>
                  </span>
                  <span>
                    Đang bán <strong className="text-success">{onSale}</strong>
                  </span>
                </p>
                <div className="mt-auto grid grid-cols-2 divide-x divide-line border-t border-line text-small font-semibold">
                  {p.status === "approved" ? (
                    <Link href={`/nha-cung-cap/lo-hang/tao-moi?productId=${p.id}`} className="flex min-h-11 items-center justify-center gap-1.5 hover:bg-surface">
                      <PlusCircle className="size-4" aria-hidden /> Khai báo lô
                    </Link>
                  ) : (
                    <span className="flex min-h-11 items-center justify-center text-subtle">Chờ duyệt để khai lô</span>
                  )}
                  <Link href={`/nha-cung-cap/lo-hang?productId=${p.id}`} className="flex min-h-11 items-center justify-center gap-1.5 text-ink-2 hover:bg-surface hover:text-ink">
                    <Layers className="size-4" aria-hidden /> Xem lô
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
