import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  Pencil,
  ShieldAlert,
  Scissors,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { Schema } from "@farmery/contract";
import { SafeImage } from "@/components/farmery/safe-image";
import { Badge, ReviewStatusBadge } from "@/components/farmery/status-badge";
import { getSellerBatch, getSellerBatchLogs, getSellerProducts } from "@/lib/data/seller";
import { formatDateVi, formatQty, formatTimeVi } from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/labels";
import { BatchQrCard } from "./batch-qr-card";
import { FarmingLogForm } from "./farming-log-form";

export const metadata: Metadata = { title: "Chi tiết lô" };

/** Hoạt động phân biệt bằng icon + nhãn chuẩn (design/04 §1), không dùng màu ngoài token. */
const ACTIVITY_ICON: Record<Schema<"FarmingActivity">, LucideIcon> = {
  planting: Sprout,
  care: Droplets,
  treatment: ShieldAlert,
  harvest: Scissors,
  other: FileText,
};

/** Chi tiết lô (design/05 N4): trạng thái + bước tiếp theo ở đầu → QR (khi đã duyệt) → nhật ký canh tác. */
export default async function SellerBatchDetailPage({ params, searchParams }: PageProps<"/nha-cung-cap/lo-hang/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const created = sp["thanh-cong"] === "1";
  /** Khi nhấn "Sửa dòng này" → URL ?edit=<logId> → form tự mở ở chế độ đính chính */
  const editLogId = typeof sp["edit"] === "string" ? sp["edit"] : undefined;

  const batch = await getSellerBatch(id);
  if (!batch) notFound();
  const [logs, products] = await Promise.all([getSellerBatchLogs(id), getSellerProducts().catch(() => [])]);
  const unit = products.find((p) => p.id === batch.productId)?.unit ?? "";

  const facts = [
    { label: "Ngày thu hoạch", value: formatDateVi(batch.harvestDate) },
    { label: "Hạn sử dụng", value: formatDateVi(batch.bestBefore) },
    { label: "Sản lượng khai báo", value: `${formatQty(batch.declaredQuantity)} ${unit}` },
    {
      label: "Thu hồi",
      value: batch.recalledAt ? `Đã thu hồi ${formatTimeVi(batch.recalledAt)}` : "Không",
      danger: Boolean(batch.recalledAt),
    },
  ];

  /** Dòng đang hiển thị (không bị superseded) */
  const activeLogs = logs.filter((l) => !l.superseded);
  /** Dòng lịch sử đã bị đính chính */
  const supersededLogs = logs.filter((l) => l.superseded);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/nha-cung-cap/lo-hang" className="inline-flex items-center gap-1.5 self-start text-small font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách lô
      </Link>

      {created && (
        <p role="status" className="flex items-start gap-2.5 rounded-card border border-success-soft bg-success-soft px-4 py-3 text-small text-ink">
          <CheckCircle2 className="mt-0.5 size-5 flex-none text-success" aria-hidden />
          <span>
            Đã gửi duyệt lô <strong className="font-mono">{batch.batchCode}</strong>. Thường có kết quả trong 48 giờ; trong lúc chờ,
            hãy ghi nhật ký canh tác bên dưới.
          </span>
        </p>
      )}

      <section className="rounded-panel border border-line p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-title font-bold text-ink">{batch.batchCode}</span>
          <ReviewStatusBadge status={batch.status} />
        </div>
        <h2 className="mt-1 text-h2-sm font-bold text-ink md:text-h2">{batch.productName}</h2>
        <p className="mt-0.5 text-small text-ink-2">Khai báo ngày {formatDateVi(batch.createdAt.slice(0, 10))}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-tile border border-line px-3.5 py-2.5">
              <dt className="text-small text-subtle">{f.label}</dt>
              <dd className={`text-title font-semibold ${f.danger ? "text-danger" : "text-ink"}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
        {batch.status !== "pending_review" && (
          <Link href={`/nha-cung-cap/lo-hang/tao-moi?productId=${batch.productId}`} className="mt-4 inline-block text-small font-semibold">
            Khai báo lô khác cho sản phẩm này →
          </Link>
        )}
      </section>

      {batch.status === "approved" && batch.traceUrl && <BatchQrCard batch={batch} traceUrl={batch.traceUrl} />}

      {batch.status === "pending_review" && (
        <section className="flex items-start gap-3 rounded-panel border border-warning-line bg-warning-soft px-5 py-4">
          <Clock className="mt-0.5 size-5 flex-none text-warning" aria-hidden />
          <div>
            <h3 className="text-title font-semibold text-ink">Chờ duyệt — thường trong 48 giờ</h3>
            <p className="mt-0.5 text-small text-ink-2">
              Kiểm duyệt viên xem thông tin lô, nhật ký canh tác và chứng nhận. Lô được duyệt sẽ có mã QR ngay tại đây để in tem.
            </p>
          </div>
        </section>
      )}

      {batch.status === "rejected" && (
        <section className="flex items-start gap-3 rounded-panel border border-danger-line bg-danger-soft px-5 py-4 text-danger-ink">
          <AlertCircle className="mt-0.5 size-5 flex-none text-danger" aria-hidden />
          <div>
            <h3 className="text-title font-semibold text-danger">Lô bị từ chối</h3>
            <p className="mt-0.5 text-small">
              <strong>Lý do:</strong> {batch.rejectReason ?? "Kiểm duyệt viên chưa ghi lý do."}
            </p>
            <p className="mt-1.5 text-small">
              Việc cần làm: bổ sung nhật ký canh tác theo lý do trên, rồi{" "}
              <Link href={`/nha-cung-cap/lo-hang/tao-moi?productId=${batch.productId}`} className="font-semibold">
                khai báo lại lô
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* Thu hồi: hiện lý do rõ ràng */}
      {batch.recalledAt && (
        <section className="flex items-start gap-3 rounded-panel border border-danger-line bg-danger-soft px-5 py-4 text-danger-ink">
          <AlertCircle className="mt-0.5 size-5 flex-none text-danger" aria-hidden />
          <div>
            <h3 className="text-title font-semibold text-danger">
              Lô đã bị thu hồi — {formatTimeVi(batch.recalledAt)}
            </h3>
            {batch.rejectReason && (
              <p className="mt-0.5 text-small">
                <strong>Lý do thu hồi:</strong> {batch.rejectReason}
              </p>
            )}
            <p className="mt-1.5 text-small text-ink-2">
              Lô thu hồi không còn được phân phối; mã QR vẫn còn hiệu lực để người mua xem thông tin.
            </p>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="nhat-ky">
        <div className="flex items-baseline justify-between">
          <h2 id="nhat-ky" className="text-h2-sm font-bold text-ink md:text-h2">
            Nhật ký canh tác
          </h2>
          <span className="text-small text-ink-2">{activeLogs.length} dòng hoạt động</span>
        </div>

        <FarmingLogForm batchId={batch.id} existingLogs={logs} initialEditLogId={editLogId} />

        {activeLogs.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-center text-small text-ink-2">
            Chưa có nhật ký. Thêm dòng đầu tiên (gieo trồng, chăm sóc, thu hoạch…) để người mua thấy quá trình canh tác.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {activeLogs.map((log) => {
              const Icon = ACTIVITY_ICON[log.activity] ?? FileText;
              return (
                <li key={log.id} className="rounded-card border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" icon={Icon}>
                        {ACTIVITY_LABELS[log.activity]}
                      </Badge>
                      <span className="text-small font-medium text-ink">{formatDateVi(log.activityDate)}</span>
                      {log.supersedesId && <Badge tone="warning">Bản đính chính</Badge>}
                    </div>
                    {/* Nút "Sửa dòng này" — mở form đính chính */}
                    <Link
                      href={`/nha-cung-cap/lo-hang/${id}?edit=${log.id}#nhat-ky`}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-btn border border-line px-3.5 py-2 text-small font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Sửa dòng này
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-small text-ink">
                    {log.description ?? "Không có mô tả."}
                  </p>
                  {log.imageUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {log.imageUrls.map((url, i) => (
                        <span key={url} className="relative size-20 overflow-hidden rounded-tile border border-line bg-surface">
                          <SafeImage src={url} alt={`Ảnh nhật ký ${formatDateVi(log.activityDate)} (${i + 1})`} fill sizes="80px" className="object-cover" />
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2.5 text-small text-subtle">
                    {log.enteredBy.displayName}
                    {log.enteredBy.onBehalf && " (nhân viên hỗ trợ vùng nhập hộ)"} · ghi lúc {formatTimeVi(log.createdAt)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        {/* Lịch sử đính chính — thu gọn */}
        {supersededLogs.length > 0 && (
          <details className="rounded-card border border-line/60">
            <summary className="cursor-pointer select-none px-4 py-3 text-small font-medium text-ink-2 hover:text-ink">
              Lịch sử đính chính ({supersededLogs.length} dòng đã được thay thế)
            </summary>
            <ol className="flex flex-col gap-2 border-t border-line/40 p-4">
              {supersededLogs.map((log) => {
                const Icon = ACTIVITY_ICON[log.activity] ?? FileText;
                return (
                  <li key={log.id} className="rounded-card border border-line/40 bg-surface-2/50 p-3 opacity-70">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" icon={Icon}>
                        {ACTIVITY_LABELS[log.activity]}
                      </Badge>
                      <span className="text-small text-subtle">{formatDateVi(log.activityDate)}</span>
                      <Badge tone="neutral">Đã được đính chính</Badge>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-small text-subtle line-through">
                      {log.description ?? "Không có mô tả."}
                    </p>
                  </li>
                );
              })}
            </ol>
          </details>
        )}
      </section>
    </div>
  );
}
