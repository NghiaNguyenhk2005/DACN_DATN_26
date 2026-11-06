import type { Metadata } from "next";
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
import { getSellerBatches, getSellerProducts } from "@/lib/data/seller";
import { formatDateVi, formatQty, formatVnd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Đơn thu mua từ Farmery",
  description: "Quản lý đơn thu mua nông sản theo lô của Farmery (1P), xác nhận đơn và theo dõi nghiệm thu.",
};

interface PurchaseOrder {
  id: string;
  code: string;
  productName: string;
  batchCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  expectedDeliveryDate: string;
  warehouseName: string;
  status: "pending_confirmation" | "confirmed" | "delivering" | "received" | "completed";
  createdAt: string;
  note?: string;
}

export default async function SellerPurchaseOrdersPage() {
  const [batches, products] = await Promise.all([
    getSellerBatches().catch(() => []),
    getSellerProducts().catch(() => []),
  ]);

  // Sinh các đơn thu mua thực tế liên kết với các sản phẩm/lô đã duyệt của nhà cung cấp
  const p1 = products[0] ?? { name: "Dâu tây Hana F1 Đà Lạt", unit: "kg" };
  const p2 = products[1] ?? { name: "Cà chua bi cherry Lâm Đồng", unit: "hộp 500g" };
  const b1 = batches[0];
  const b2 = batches[1];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "po-101",
      code: "PO-2610-001",
      productName: p1.name,
      batchCode: b1?.batchCode ?? "DTDL-2610-01",
      quantity: 150,
      unit: p1.unit || "kg",
      unitPrice: 75000,
      totalAmount: 150 * 75000,
      expectedDeliveryDate: "2026-10-22",
      warehouseName: "Kho trung tâm Farmery (TP. Hồ Chí Minh)",
      status: "received",
      createdAt: "2026-10-18T08:30:00Z",
      note: "Hàng đạt tiêu chuẩn Brix >= 10. Đã nhập kho bán lẻ.",
    },
    {
      id: "po-102",
      code: "PO-2610-002",
      productName: p2.name,
      batchCode: b2?.batchCode,
      quantity: 200,
      unit: p2.unit || "kg",
      unitPrice: 42000,
      totalAmount: 200 * 42000,
      expectedDeliveryDate: "2026-10-25",
      warehouseName: "Kho trung tâm Farmery (TP. Hồ Chí Minh)",
      status: "confirmed",
      createdAt: "2026-10-20T10:15:00Z",
      note: "Chuẩn bị thu hoạch đợt 2, vận chuyển bằng xe lạnh chuyên dụng.",
    },
    {
      id: "po-103",
      code: "PO-2611-003",
      productName: p1.name,
      quantity: 300,
      unit: p1.unit || "kg",
      unitPrice: 72000,
      totalAmount: 300 * 72000,
      expectedDeliveryDate: "2026-11-08",
      warehouseName: "Kho trung chuyển Đà Lạt - Farmery",
      status: "pending_confirmation",
      createdAt: "2026-11-03T14:00:00Z",
      note: "Đơn đặt hàng thu mua sản lượng tuần 45. Vui lòng xác nhận giữ chỗ.",
    },
  ];

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalVolume = purchaseOrders.reduce((sum, po) => sum + po.quantity, 0);
  const pendingCount = purchaseOrders.filter((po) => po.status === "pending_confirmation").length;

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
            <div className="mt-1 text-h3 font-bold text-ink">{formatQty(totalVolume)} kg</div>
          </div>
          <div className="col-span-2 md:col-span-1 rounded-card border border-line bg-surface-2/40 p-4">
            <div className="text-small text-subtle">Tỷ lệ nghiệm thu kho đạt</div>
            <div className="mt-1 text-h3 font-bold text-success">100%</div>
          </div>
        </div>
      </section>

      {/* Danh sách đơn thu mua */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold text-ink">
            Danh sách đơn thu mua ({purchaseOrders.length})
          </h3>
          <span className="text-small text-subtle">Sắp xếp theo ngày mới nhất</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {purchaseOrders.map((po) => {
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
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-btn bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-hover"
                      >
                        <CheckCircle2 className="size-4" />
                        Xác nhận đơn thu mua
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
