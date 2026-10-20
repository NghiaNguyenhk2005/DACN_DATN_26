import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  History,
  Package,
  RefreshCw,
  Scale,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  UserCheck,
} from "lucide-react";
import type { Schema } from "@farmery/contract";
import { getSellerBatch, getSellerBatchLogs } from "@/lib/data/seller";
import { BatchQrCard } from "./batch-qr-card";
import { FarmingLogForm } from "./farming-log-form";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ "thanh-cong"?: string }>;
}

const ACTIVITY_CONFIG: Record<
  Schema<"FarmingActivity">,
  { label: string; icon: typeof Sprout; color: string }
> = {
  planting: {
    label: "Gieo giống & Xuống giống",
    icon: Sprout,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  care: {
    label: "Chăm sóc & Bón phân & Tưới tiêu",
    icon: Droplets,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  treatment: {
    label: "Xử lý sâu bệnh & Vi sinh",
    icon: ShieldAlert,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  harvest: {
    label: "Thu hoạch & Phân loại chất lượng",
    icon: Scissors,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  other: {
    label: "Hoạt động canh tác khác",
    icon: FileText,
    color: "bg-zinc-50 text-zinc-700 border-zinc-200",
  },
};

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
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h3 className="font-heading text-h2 font-bold text-ink">
              Nhật ký canh tác & Quy trình chăm sóc
            </h3>
          </div>
          <span className="text-caption text-ink-2">
            Tổng số: <strong className="text-ink">{logs.length}</strong> mốc canh tác
          </span>
        </div>

        {/* Form thêm nhật ký canh tác */}
        <FarmingLogForm batchId={batch.id} existingLogs={logs} />

        {/* Danh sách nhật ký đã ghi */}
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-subtle">
            <Sprout className="mx-auto size-8 text-subtle opacity-60" />
            <p className="mt-2 text-small">
              Chưa có mục nhật ký canh tác nào được ghi cho lô này. Hãy thêm mục nhật ký đầu tiên (gieo trồng, bón phân, thu hoạch...) để bảo đảm minh bạch nguồn gốc nông sản.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 before:absolute before:bottom-3 before:left-2.5 before:top-3 before:w-0.5 before:bg-line space-y-4">
            {logs.map((log) => {
              const actConfig =
                ACTIVITY_CONFIG[log.activity] ?? ACTIVITY_CONFIG.other;
              const ActIcon = actConfig.icon;
              const isSuperseded = Boolean(log.superseded);
              const isCorrection = Boolean(log.supersedesId);

              return (
                <div
                  key={log.id}
                  className={`relative rounded-2xl border p-5 shadow-2xs transition-all ${
                    isSuperseded
                      ? "border-line bg-surface-2/40 opacity-70"
                      : "border-line bg-surface hover:shadow-xs"
                  }`}
                >
                  {/* Điểm nối timeline */}
                  <div
                    className={`absolute -left-[30px] top-6 size-3.5 rounded-full border-2 border-surface ${
                      isSuperseded
                        ? "bg-muted-foreground"
                        : isCorrection
                          ? "bg-warning-dot"
                          : "bg-primary"
                    }`}
                  />

                  {/* Header của một mục nhật ký */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-semibold ${actConfig.color}`}
                      >
                        <ActIcon className="size-3.5" />
                        {actConfig.label}
                      </span>

                      <span className="font-mono text-micro text-subtle">
                        #{log.id}
                      </span>

                      {isCorrection && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-micro font-semibold text-warning-dot">
                          <RefreshCw className="size-3" />
                          Đính chính cho #{log.supersedesId}
                        </span>
                      )}

                      {isSuperseded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-micro font-semibold text-danger">
                          <AlertCircle className="size-3" />
                          Đã bị đính chính (Lịch sử)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-caption text-ink-2">
                      <Calendar className="size-3.5 text-subtle" />
                      <span>Ngày thực hiện:</span>
                      <strong className="font-medium text-ink">
                        {log.activityDate}
                      </strong>
                    </div>
                  </div>

                  {/* Mô tả hoạt động */}
                  <div className="pt-3">
                    <p
                      className={`text-small leading-relaxed whitespace-pre-line ${
                        isSuperseded ? "text-subtle line-through" : "text-ink"
                      }`}
                    >
                      {log.description ?? "Không có mô tả chi tiết."}
                    </p>
                  </div>

                  {/* Ảnh đính kèm nếu có */}
                  {log.imageUrls && log.imageUrls.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2.5 pt-2">
                      {log.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative size-18 overflow-hidden rounded-xl border border-line bg-surface-2 sm:size-20"
                        >
                          <Image
                            src={url}
                            alt={`Ảnh nhật ký ${log.id}-${idx + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Thông tin người nhập */}
                  <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2.5 text-micro text-subtle">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-primary" />
                      <span>
                        Người ghi:{" "}
                        <strong className="font-medium text-ink-2">
                          {log.enteredBy?.displayName ?? "Đại diện nhà cung cấp"}
                        </strong>
                        {log.enteredBy?.onBehalf && " (Cán bộ hỗ trợ vùng)"}
                      </span>
                    </div>

                    <span>
                      Ghi nhận lúc:{" "}
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
