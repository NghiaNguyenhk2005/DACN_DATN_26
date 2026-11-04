import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, X } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { ReviewStatusBadge } from "@/components/farmery/status-badge";
import { getSellerBatches, getSellerProducts } from "@/lib/data/seller";
import { formatDateVi, formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lô hàng" };

const STATUS_FILTERS: { label: string; value?: Schema<"ReviewStatus"> }[] = [
  { label: "Tất cả" },
  { label: "Chờ duyệt", value: "pending_review" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Bị từ chối", value: "rejected" },
];
const STATUSES = new Set(STATUS_FILTERS.map((f) => f.value).filter(Boolean));

/** Danh sách lô (design/05 N2): lọc trạng thái dạng nút gạt + chip sản phẩm; thẻ lô có sản lượng theo đơn vị bán. */
export default async function SellerBatchesPage({ searchParams }: PageProps<"/nha-cung-cap/lo-hang">) {
  const sp = await searchParams;
  const rawStatus = typeof sp.status === "string" ? sp.status : undefined;
  const status = STATUSES.has(rawStatus as Schema<"ReviewStatus">) ? (rawStatus as Schema<"ReviewStatus">) : undefined;
  const productId = typeof sp.productId === "string" && /^\d+$/.test(sp.productId) ? sp.productId : undefined;
  const [batches, products] = await Promise.all([getSellerBatches({ status, productId }), getSellerProducts()]);
  const units = new Map(products.map((p) => [p.id, p.unit]));
  const selected = products.find((p) => p.id === productId);

  const href = (s?: string, pid?: string) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (pid) q.set("productId", pid);
    const qs = q.toString();
    return `/nha-cung-cap/lo-hang${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label="Lọc theo trạng thái" className="flex gap-1 rounded-btn bg-surface p-1">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.label}
                href={href(f.value, productId)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded-[7px] px-3 py-1.5 text-small font-medium text-ink-2 hover:text-ink",
                  active && "bg-background font-semibold text-primary shadow-segment hover:text-primary",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        {selected && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-chip bg-surface px-3 py-1.5 text-small font-semibold text-primary">
            Sản phẩm: {selected.name}
            <Link href={href(status)} aria-label="Bỏ lọc sản phẩm" className="text-ink-2 hover:text-ink">
              <X className="size-4" aria-hidden />
            </Link>
          </span>
        )}
      </div>

      {batches.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
          Không có lô nào khớp bộ lọc. <Link href="/nha-cung-cap/lo-hang/tao-moi">Khai báo lô mới</Link>
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <li key={b.id} className="flex flex-col rounded-card border border-line">
              <Link href={`/nha-cung-cap/lo-hang/${b.id}`} className="flex flex-1 flex-col gap-2.5 p-4 text-ink hover:text-ink">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-title font-bold">{b.batchCode}</span>
                    <h3 className="mt-0.5 line-clamp-1 text-title font-medium text-ink-2">{b.productName}</h3>
                  </div>
                  <ReviewStatusBadge status={b.status} />
                </div>
                <dl className="grid grid-cols-3 gap-2 border-t border-line pt-2.5 text-small">
                  <div>
                    <dt className="text-subtle">Thu hoạch</dt>
                    <dd className="font-medium">{formatDateVi(b.harvestDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Hạn sử dụng</dt>
                    <dd className="font-medium">{formatDateVi(b.bestBefore)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Sản lượng</dt>
                    <dd className="font-medium">
                      {formatQty(b.declaredQuantity)} {units.get(b.productId) ?? ""}
                    </dd>
                  </div>
                </dl>
                {b.status === "rejected" && b.rejectReason && (
                  <p className="rounded-tile bg-danger-soft px-3 py-2 text-small text-danger-ink">
                    <strong>Lý do:</strong> {b.rejectReason}
                  </p>
                )}
                {b.recalledAt && <p className="text-small font-semibold text-danger">Lô đã thu hồi</p>}
              </Link>
              {b.status === "approved" && b.traceCode && (
                <p className="flex items-center gap-1.5 border-t border-line px-4 py-2.5 text-small text-ink-2">
                  <QrCode className="size-4 text-primary" aria-hidden /> Mã truy xuất <code className="font-mono font-semibold text-ink">{b.traceCode}</code>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
