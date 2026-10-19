import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Package,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getSellerBatch, getSellerBatchLogs } from "@/lib/data/seller";
import { BatchQrCard } from "./batch-qr-card";
import { FarmingLogForm } from "./farming-log-form";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ "thanh-cong"?: string }>;
}

export default async function SellerBatchDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { "thanh-cong": isSuccess } = await searchParams;

  const [batch, logs] = await Promise.all([
    getSellerBatch(id),
    getSellerBatchLogs(id),
  ]);

  if (!batch) {
    notFound();
  }

  const isApproved = batch.status === "approved";
  const isPending = batch.status === "pending_review";
  const isRejected = batch.status === "rejected";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Quay lại */}
      <div className="flex items-center gap-2">
        <Link
          href="/nha-cung-cap/lo-hang"
          className="inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách lô hàng</span>
        </Link>
      </div>

      {/* Thông báo tạo thành công nếu có param thanh-cong */}
      {isSuccess && (
        <div className="flex items-start gap-3 rounded-2xl border border-leaf-soft bg-leaf-soft/40 p-4 text-small text-ink">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <strong className="font-semibold text-primary">Khai báo lô hàng thành công!</strong>
            <p className="mt-0.5 text-ink-2">
              Lô hàng <strong className="font-mono text-ink">{batch.batchCode}</strong> đã được nộp vào Hàng đợi kiểm duyệt. Kiểm định viên sẽ xác nhận chất lượng trước khi phát hành mã QR mở bán.
            </p>
          </div>
        </div>
      )}

      {/* Header Lô hàng */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-title font-bold tracking-tight text-ink md:text-h2">
                {batch.batchCode}
              </span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-3 py-1 text-caption font-semibold text-primary">
                  <CheckCircle2 className="size-3.5" /> Đã phê duyệt mở bán
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-caption font-semibold text-warning-dot">
                  <Clock className="size-3.5" /> Chờ kiểm định
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-3 py-1 text-caption font-semibold text-danger">
                  <AlertCircle className="size-3.5" /> Bị từ chối
                </span>
              )}
            </div>

            <h1 className="mt-1 font-heading text-h2 font-bold text-ink md:text-h1">
              {batch.productName}
            </h1>
            <p className="mt-1 text-small text-ink-2">
              Mã định danh lô: <code className="font-mono text-ink">#{batch.id}</code> · Khởi tạo ngày {new Date(batch.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <Link
            href={`/nha-cung-cap/lo-hang/tao-moi?productId=${batch.productId}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-btn border border-line bg-surface px-3.5 text-caption font-medium text-ink transition-colors hover:bg-surface-2 sm:self-auto"
          >
            <Package className="size-3.5" />
            <span>Tạo lô khác cho mặt hàng này</span>
          </Link>
        </div>

        {/* Lưới thông số nhanh */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line/60 pt-4 sm:grid-cols-4">
          <div className="rounded-lg bg-surface-2/60 p-3">
            <span className="flex items-center gap-1.5 text-micro text-subtle">
              <Calendar className="size-3.5" /> Ngày thu hoạch:
            </span>
            <p className="mt-1 font-heading text-title font-bold text-ink">{batch.harvestDate}</p>
          </div>

          <div className="rounded-lg bg-surface-2/60 p-3">
            <span className="flex items-center gap-1.5 text-micro text-subtle">
              <Clock className="size-3.5" /> Hạn dùng tốt nhất:
            </span>
            <p className="mt-1 font-heading text-title font-bold text-ink">{batch.bestBefore}</p>
          </div>

          <div className="rounded-lg bg-surface-2/60 p-3">
            <span className="flex items-center gap-1.5 text-micro text-subtle">
              <Scale className="size-3.5" /> Sản lượng khai báo:
            </span>
            <p className="mt-1 font-heading text-title font-bold text-ink">
              {batch.declaredQuantity.toLocaleString("vi-VN")} đơn vị
            </p>
          </div>

          <div className="rounded-lg bg-surface-2/60 p-3">
            <span className="flex items-center gap-1.5 text-micro text-subtle">
              <ShieldCheck className="size-3.5" /> Trạng thái thu hồi:
            </span>
            <p className="mt-1 font-heading text-title font-bold text-leaf">
              {batch.recalledAt ? "Đang thu hồi" : "Bình thường (An toàn)"}
            </p>
          </div>
        </div>
      </div>

      {/* Khối Trạng thái duyệt & Mã QR */}
      {isApproved && (
        <section>
          <BatchQrCard batch={batch} />
        </section>
      )}

      {isPending && (
        <section className="rounded-2xl border border-warning-line bg-warning-soft/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-dot text-white">
              <Clock className="size-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-title font-bold text-warning-dot">
                Lô hàng đang trong hàng đợi kiểm duyệt chất lượng
              </h3>
              <p className="text-small text-ink-2">
                Hệ thống và chuyên viên thẩm định đang rà soát chỉ số nhật ký canh tác và vùng trồng Đà Lạt. Khi được phê duyệt, <strong>mã QR truy xuất nguồn gốc</strong> sẽ được kích hoạt ngay tại đây để nhà cung cấp in tem nhãn.
              </p>
            </div>
          </div>
        </section>
      )}

      {isRejected && (
        <section className="rounded-2xl border border-danger-line bg-danger-soft p-6 text-danger-ink">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger text-white">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-title font-bold text-danger">
                Lô hàng chưa đạt tiêu chuẩn phê duyệt
              </h3>
              <p className="text-small">
                <strong>Lý do:</strong> {batch.rejectReason ?? "Hồ sơ kiểm định chưa đạt yêu cầu an toàn thực phẩm."}
              </p>
              <p className="text-caption text-subtle">
                Bạn có thể bổ sung các bản ghi đính chính hoặc cung cấp thêm hình ảnh trong phần nhật ký canh tác bên dưới.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Khối Nhật ký canh tác & Ghi chép nối thêm */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h3 className="font-heading text-h2 font-bold text-ink">
              Nhật ký canh tác & Quy trình chăm sóc
            </h3>
          </div>
          <span className="text-caption text-ink-2">
            Tổng cộng: <strong className="text-ink">{logs.length}</strong> mục
          </span>
        </div>

        {/* Form thêm nhật ký canh tác */}
        <FarmingLogForm batchId={batch.id} existingLogs={logs} />

        {/* Danh sách nhật ký đã ghi */}
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-subtle">
            <p className="text-small">
              Chưa có mục nhật ký canh tác nào được ghi cho lô này. Hãy thêm nhật ký đầu tiên (tưới nước, bón phân, thu hoạch...) để minh bạch với người tiêu dùng.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-surface-2 px-2 py-0.5 font-mono text-micro font-medium text-ink">
                      #{log.id}
                    </span>
                    <span className="font-heading text-title font-semibold text-ink">
                      {log.activity}
                    </span>
                    {log.supersedesId && (
                      <span className="rounded bg-warning-soft px-2 py-0.5 text-micro font-semibold text-warning-dot">
                        Bản đính chính cho #{log.supersedesId}
                      </span>
                    )}
                  </div>
                  <span className="text-caption text-subtle">
                    Ngày thực hiện: <strong className="text-ink">{log.activityDate}</strong>
                  </span>
                </div>

                <p className="text-small text-ink-2 whitespace-pre-line">
                  {log.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
