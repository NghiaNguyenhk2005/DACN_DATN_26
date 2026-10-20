import Link from "next/link";
import type { Schema } from "@farmery/contract";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  PlusCircle,
  QrCode,
  Scale,
} from "lucide-react";
import { getSellerBatches, getSellerProducts } from "@/lib/data/seller";
import { formatDateVi } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    status?: Schema<"ReviewStatus">;
    productId?: string;
  }>;
}

export default async function SellerBatchesPage({ searchParams }: PageProps) {
  const { status, productId } = await searchParams;
  const [batches, products] = await Promise.all([
    getSellerBatches({ status, productId }),
    getSellerProducts(),
  ]);

  const selectedProduct = products.find((p) => p.id === productId);

  const statusFilters: { label: string; value?: Schema<"ReviewStatus"> }[] = [
    { label: "Tất cả lô" },
    { label: "Chờ kiểm duyệt", value: "pending_review" },
    { label: "Đã duyệt mở bán", value: "approved" },
    { label: "Bị từ chối", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-h2 font-bold text-ink">
            Quản lý lô hàng nông sản
          </h2>
          <p className="text-small text-ink-2">
            Theo dõi tiến trình kiểm duyệt, cấp mã truy xuất nguồn gốc và phát hành tem QR cho từng mẻ thu hoạch.
          </p>
        </div>

        <Link
          href="/nha-cung-cap/lo-hang/tao-moi"
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-btn bg-cta px-4 text-small font-semibold text-white shadow-xs transition-colors hover:bg-cta-hover sm:self-auto"
        >
          <PlusCircle className="size-4" />
          <span>Khai báo lô mới</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((tab) => {
            const active = status === tab.value || (!status && !tab.value);
            const query: Record<string, string> = {};
            if (tab.value) query.status = tab.value;
            if (productId) query.productId = productId;
            const href = `/nha-cung-cap/lo-hang${
              Object.keys(query).length > 0
                ? `?${new URLSearchParams(query).toString()}`
                : ""
            }`;

            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-caption font-medium transition-colors",
                  active
                    ? "bg-primary text-white shadow-2xs font-semibold"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {selectedProduct && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1 text-caption text-ink">
            <span>Lọc theo: <strong>{selectedProduct.name}</strong></span>
            <Link
              href={status ? `/nha-cung-cap/lo-hang?status=${status}` : "/nha-cung-cap/lo-hang"}
              className="text-subtle hover:text-ink"
              title="Bỏ lọc sản phẩm"
            >
              ✕
            </Link>
          </div>
        )}
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface py-12 text-center">
          <Layers className="size-12 text-subtle" />
          <h3 className="mt-3 font-heading text-title font-bold text-ink">
            Chưa có lô hàng nào phù hợp
          </h3>
          <p className="mt-1 max-w-sm text-small text-ink-2">
            Không tìm thấy lô hàng nào trong danh mục lọc hiện tại. Hãy tạo mới một đợt thu hoạch để bắt đầu.
          </p>
          <Link
            href="/nha-cung-cap/lo-hang/tao-moi"
            className="mt-4 inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <PlusCircle className="size-4" />
            <span>Khai báo lô thu hoạch</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => {
            const isApproved = batch.status === "approved";
            const isPending = batch.status === "pending_review";
            const isRejected = batch.status === "rejected";

            return (
              <div
                key={batch.id}
                className="flex flex-col justify-between rounded-xl border border-line bg-card p-5 shadow-2xs transition-all hover:border-line-strong hover:shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-title font-bold tracking-tight text-ink">
                        {batch.batchCode}
                      </span>
                      <h4 className="mt-0.5 font-heading text-title font-semibold text-ink line-clamp-1">
                        {batch.productName}
                      </h4>
                    </div>

                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-0.5 text-micro font-semibold text-primary">
                        <CheckCircle2 className="size-3" /> Đã duyệt
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-micro font-semibold text-warning-dot">
                        <Clock className="size-3" /> Chờ duyệt
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-micro font-semibold text-danger">
                        <AlertCircle className="size-3" /> Từ chối
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 border-t border-line/60 pt-3 text-caption text-ink-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-subtle">
                        <Calendar className="size-3.5" /> Thu hoạch:
                      </span>
                      <span className="font-medium text-ink">{formatDateVi(batch.harvestDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-subtle">
                        <Clock className="size-3.5" /> Hạn dùng:
                      </span>
                      <span className="font-medium text-ink">{formatDateVi(batch.bestBefore)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-subtle">
                        <Scale className="size-3.5" /> Sản lượng:
                      </span>
                      <span className="font-medium text-ink">{batch.declaredQuantity.toLocaleString("vi-VN")} đơn vị</span>
                    </div>
                  </div>

                  {isRejected && batch.rejectReason && (
                    <div className="rounded-lg bg-danger-soft/60 p-2.5 text-caption text-danger">
                      <strong>Lý do từ chối:</strong> {batch.rejectReason}
                    </div>
                  )}

                  {isApproved && batch.traceCode && (
                    <div className="rounded-lg bg-leaf-soft/50 p-2.5 text-caption text-primary">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Mã QR truy xuất:</span>
                        <code className="font-mono font-bold">{batch.traceCode}</code>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                  <Link
                    href={`/nha-cung-cap/lo-hang/${batch.id}`}
                    className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    <QrCode className="size-4" />
                    <span>Chi tiết & Mã QR</span>
                  </Link>

                  {isApproved && batch.traceUrl && (
                    <Link
                      href={batch.traceUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-micro text-ink-2 transition-colors hover:text-ink"
                    >
                      <span>Xem trang QR</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
