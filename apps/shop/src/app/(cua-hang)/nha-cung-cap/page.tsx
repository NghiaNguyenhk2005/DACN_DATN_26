import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Package,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { getSellerProducts, getSellerBatches } from "@/lib/data/seller";

export default async function SellerProductsPage() {
  const [products, batches] = await Promise.all([
    getSellerProducts(),
    getSellerBatches(),
  ]);

  const approvedBatches = batches.filter((b) => b.status === "approved");
  const pendingBatches = batches.filter((b) => b.status === "pending_review");
  const rejectedBatches = batches.filter((b) => b.status === "rejected");

  return (
    <div className="space-y-8">
      {/* Khối Thẻ Thống kê nhanh KPI */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-small font-medium">Sản phẩm</span>
            <Package className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-h2 font-bold text-ink">{products.length}</span>
            <span className="text-caption text-ink-2">mặt hàng</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-small font-medium">Lô đã duyệt</span>
            <CheckCircle2 className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-h2 font-bold text-primary">{approvedBatches.length}</span>
            <span className="text-caption text-ink-2">lô mở bán</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-small font-medium">Đang chờ duyệt</span>
            <Clock className="size-4 text-warning-dot" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-h2 font-bold text-warning-dot">{pendingBatches.length}</span>
            <span className="text-caption text-ink-2">hàng đợi</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-small font-medium">Cần bổ sung</span>
            <AlertCircle className="size-4 text-danger" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-h2 font-bold text-danger">{rejectedBatches.length}</span>
            <span className="text-caption text-ink-2">từ chối</span>
          </div>
        </div>
      </section>

      {/* Danh sách sản phẩm của nhà cung cấp */}
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-h2 font-bold text-ink">
              Danh mục sản phẩm đã đăng ký
            </h2>
            <p className="text-small text-ink-2">
              Các mặt hàng nông sản đã qua kiểm định đạt chuẩn VietGAP được phép tạo lô hàng xuất xưởng.
            </p>
          </div>
          <Link
            href="/nha-cung-cap/lo-hang/tao-moi"
            className="inline-flex items-center gap-1.5 self-start text-title font-semibold text-primary transition-colors hover:text-primary-hover sm:self-auto"
          >
            <span>Khai báo lô thu hoạch</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const productBatches = batches.filter((b) => b.productId === product.id);
            const approvedCount = productBatches.filter((b) => b.status === "approved").length;

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-card transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-subtle">
                          <Package className="size-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-leaf-soft px-2 py-0.5 text-micro font-semibold text-primary">
                          <CheckCircle2 className="size-3" /> Đã duyệt
                        </span>
                        <span className="text-micro text-subtle">ID #{product.id}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-1 font-heading text-title font-bold text-ink">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-caption text-ink-2">
                        Quy cách đóng gói: <span className="font-medium text-ink">{product.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-caption text-ink-2">
                    <span>Tổng số lô: <strong className="text-ink">{productBatches.length}</strong></span>
                    <span>Đang mở bán: <strong className="text-primary">{approvedCount}</strong></span>
                  </div>
                </div>

                <div className="flex items-center divide-x divide-line border-t border-line bg-surface-2/50 text-caption font-medium">
                  <Link
                    href={`/nha-cung-cap/lo-hang/tao-moi?productId=${product.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-primary transition-colors hover:bg-surface-2 hover:text-primary-hover"
                  >
                    <PlusCircle className="size-3.5" />
                    <span>Tạo lô mới</span>
                  </Link>
                  <Link
                    href={`/nha-cung-cap/lo-hang?productId=${product.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Layers className="size-3.5" />
                    <span>Xem các lô</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Khối Hướng dẫn quy trình quản lý lô & Truy xuất QR */}
      <section className="overflow-hidden rounded-2xl border border-leaf-soft bg-gradient-to-r from-leaf-soft/30 to-surface p-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <h3 className="font-heading text-title font-bold">
            Quy trình vận hành chuẩn từ nông trại tới tay người tiêu dùng
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-line/80 bg-surface/80 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-small font-bold text-white">
              1
            </span>
            <h4 className="mt-2.5 font-heading text-title font-semibold text-ink">
              Khai báo lô thu hoạch
            </h4>
            <p className="mt-1 text-caption text-ink-2">
              Nhà cung cấp nhập ngày thu hoạch, hạn dùng tốt nhất và sản lượng dự kiến thực tế của đợt thu hái.
            </p>
          </div>

          <div className="rounded-xl border border-line/80 bg-surface/80 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-small font-bold text-white">
              2
            </span>
            <h4 className="mt-2.5 font-heading text-title font-semibold text-ink">
              Kiểm duyệt & Cấp mã QR
            </h4>
            <p className="mt-1 text-caption text-ink-2">
              Hệ thống xác minh chỉ số an toàn, sinh mã định danh và cấp mã QR tem nhãn truy xuất nguồn gốc.
            </p>
          </div>

          <div className="rounded-xl border border-line/80 bg-surface/80 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-small font-bold text-white">
              3
            </span>
            <h4 className="mt-2.5 font-heading text-title font-semibold text-ink">
              Ghi nhật ký canh tác
            </h4>
            <p className="mt-1 text-caption text-ink-2">
              Bổ sung nhật ký bón phân, thu hoạch và minh bạch thông tin trực tiếp tới người mua hàng qua mã QR.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
