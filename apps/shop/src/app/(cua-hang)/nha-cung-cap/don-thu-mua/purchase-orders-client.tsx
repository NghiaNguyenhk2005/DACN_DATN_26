"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { formatDateVi, formatQty, formatVnd } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/data/mock-purchase-orders";

const STATUS_CONFIG: Record<
  PurchaseOrder["status"],
  { label: string; badgeClass: string; icon: typeof CheckCircle2 }
> = {
  pending_confirmation: {
    label: "Chờ xác nhận",
    badgeClass: "bg-warning-soft text-warning-dot border-warning-line/60",
    icon: Clock,
  },
  confirmed: {
    label: "Đã xác nhận",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
  },
  delivering: {
    label: "Đang vận chuyển",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Truck,
  },
  received: {
    label: "Đã nghiệm thu",
    badgeClass: "bg-leaf-soft text-primary border-leaf-soft",
    icon: FileCheck,
  },
  completed: {
    label: "Đã quyết toán",
    badgeClass: "bg-surface-2 text-ink border-line",
    icon: DollarSign,
  },
};

export function PurchaseOrdersClient({
  initialOrders,
}: {
  initialOrders: PurchaseOrder[];
}) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = (id: string) => {
    setConfirmingId(id);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((po) =>
          po.id === id ? { ...po, status: "confirmed" as const } : po
        )
      );
      setConfirmingId(null);
    }, 300);
  };

  // Tính tổng giá trị
  const totalValue = orders.reduce((sum, po) => sum + po.totalAmount, 0);

  // Nhóm sản lượng theo đơn vị (kg, hộp) tránh cộng gộp lẫn lộn
  const volumesByUnit = orders.reduce<Record<string, number>>((acc, po) => {
    acc[po.unit] = (acc[po.unit] ?? 0) + po.quantity;
    return acc;
  }, {});
  const volumeSummaryText = Object.entries(volumesByUnit)
    .map(([u, q]) => `${formatQty(q)} ${u}`)
    .join(" + ");

  // Tỷ lệ nghiệm thu kho đạt = (số đơn received hoặc completed) / (số đơn không pending)
  const nonPendingOrders = orders.filter((po) => po.status !== "pending_confirmation");
  const acceptedOrders = orders.filter(
    (po) => po.status === "received" || po.status === "completed"
  );
  const acceptanceRate =
    nonPendingOrders.length > 0
      ? Math.round((acceptedOrders.length / nonPendingOrders.length) * 100)
      : 100;

  const pendingCount = orders.filter((po) => po.status === "pending_confirmation").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Giới thiệu quy trình thu mua 1P */}
      <section className="rounded-panel border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <h2 className="text-h2-sm font-bold text-ink md:text-h2">
                Đơn thu mua từ Farmery (1P)
              </h2>
            </div>
            <p className="text-small text-ink-2 max-w-2xl leading-relaxed">
              Farmery bao tiêu và thu mua nông sản theo từng lô đạt chuẩn. Sau khi quý nhà vườn xác nhận,
              sản lượng được giữ chỗ và nghiệm thu tại kho Farmery trước khi mở dòng tồn bán lẻ.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-card border border-warning-line bg-warning-soft px-4 py-2.5 text-small font-semibold text-warning-dot">
              <Clock className="size-4 shrink-0" />
              <span>Có {pendingCount} đơn thu mua chờ xác nhận</span>
            </div>
          )}
        </div>

        {/* Các chỉ số tổng quan */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-card border border-line bg-surface-2/40 p-4">
            <div className="text-small text-subtle">Tổng giá trị thu mua</div>
            <div className="mt-1 text-h3 font-bold text-primary">{formatVnd(totalValue)}</div>
          </div>
          <div className="rounded-card border border-line bg-surface-2/40 p-4">
            <div className="text-small text-subtle">Sản lượng đã bao tiêu</div>
            <div className="mt-1 text-h3 font-bold text-ink">{volumeSummaryText || "0"}</div>
          </div>
          <div className="col-span-2 md:col-span-1 rounded-card border border-line bg-surface-2/40 p-4">
            <div className="text-small text-subtle">Tỷ lệ nghiệm thu kho đạt</div>
            <div className="mt-1 text-h3 font-bold text-success">{acceptanceRate}%</div>
          </div>
        </div>
      </section>

      {/* Danh sách đơn thu mua */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold text-ink">
            Danh sách đơn thu mua ({orders.length})
          </h3>
          <span className="text-small text-subtle">Sắp xếp theo ngày mới nhất</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {orders.map((po) => {
            const statusConfig = STATUS_CONFIG[po.status];
            const StatusIcon = statusConfig.icon;
            const isPending = po.status === "pending_confirmation";

            return (
              <div
                key={po.id}
                className="rounded-panel border border-line bg-surface p-5 space-y-4 transition-all hover:border-line-strong"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-title font-bold text-ink">{po.code}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-micro font-semibold ${statusConfig.badgeClass}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {statusConfig.label}
                    </span>
                    {po.batchCode && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-micro text-subtle">
                        Lô: {po.batchCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-small text-ink-2">
                    <Calendar className="size-4 text-subtle" />
                    <span>Hẹn giao:</span>
                    <strong className="font-semibold text-ink">
                      {formatDateVi(po.expectedDeliveryDate)}
                    </strong>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <div className="text-caption text-subtle">Sản phẩm thu mua</div>
                    <div className="text-body font-semibold text-ink">{po.productName}</div>
                  </div>
                  <div>
                    <div className="text-caption text-subtle">Sản lượng đặt mua</div>
                    <div className="text-body font-semibold text-ink">
                      {formatQty(po.quantity)} {po.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-caption text-subtle">Đơn giá bao tiêu</div>
                    <div className="text-body font-semibold text-primary">
                      {formatVnd(po.unitPrice)} / {po.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-caption text-subtle">Tổng thành tiền</div>
                    <div className="text-body font-bold text-cta">{formatVnd(po.totalAmount)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3 text-small text-subtle">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-subtle" />
                    <span>Điểm tiếp nhận: <strong className="text-ink-2">{po.warehouseName}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => handleConfirm(po.id)}
                        disabled={confirmingId === po.id}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-btn bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" />
                        {confirmingId === po.id ? "Đang xác nhận..." : "Xác nhận đơn thu mua"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-btn border border-line px-3.5 py-2 text-small font-medium text-ink transition-colors hover:bg-surface-2"
                      >
                        <FileText className="size-4 text-subtle" />
                        Biên bản nghiệm thu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

