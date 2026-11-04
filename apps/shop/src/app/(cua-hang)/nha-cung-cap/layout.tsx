import type { Metadata } from "next";
import { Factory, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/farmery/empty-state";
import { getSupplier } from "@/lib/data";
import { isSeller, requireViewer } from "@/lib/data/account";
import { getSellerBatches, getSellerCertifications } from "@/lib/data/seller";
import { certValidity, todayVn } from "@/lib/decision";
import { CERT_LABELS } from "@/lib/labels";
import { SellerNav } from "./seller-nav-tabs";

export const metadata: Metadata = {
  title: "Khu nhà cung cấp",
  description: "Nhà cung cấp quản lý sản phẩm, khai báo lô thu hoạch, ghi nhật ký canh tác, chứng nhận và lấy mã QR truy xuất.",
};

/** Đầu khu: tên, vùng trồng, chứng nhận còn hiệu lực; hàng điều hướng (tab = nơi đến, hành động = nút). */
export default async function SellerLayout({ children }: LayoutProps<"/nha-cung-cap">) {
  const viewer = await requireViewer("/nha-cung-cap");
  if (!isSeller(viewer)) {
    return (
      <div className="py-8">
        <EmptyState
          icon={Factory}
          title="Khu dành cho nhà cung cấp"
          description="Tài khoản đang đăng nhập không phải tài khoản nhà cung cấp. Đăng xuất rồi đăng nhập bằng tài khoản nhà cung cấp để khai báo lô."
          action={{ label: "Về trang chủ", href: "/" }}
        />
      </div>
    );
  }
  const [supplier, rejected, certs] = await Promise.all([
    getSupplier(viewer.supplierId!),
    getSellerBatches({ status: "rejected" }).catch(() => []),
    getSellerCertifications().catch(() => []),
  ]);
  const today = todayVn();
  const validCerts = supplier?.certifications.filter((c) => c.valid) ?? [];
  const certAttention = certs.filter((c) => c.status === "rejected" || (c.status === "approved" && certValidity(c, today) !== "valid")).length;

  return (
    <div className="pb-24 pt-5 md:pb-8 md:pt-7">
      <header className="mb-4 flex items-start gap-3.5 md:mb-5 md:items-center md:gap-4">
        <span className="grid size-12 flex-none place-items-center rounded-panel bg-primary text-white md:size-14">
          <Factory className="size-6 md:size-7" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-h2-sm font-bold text-ink md:text-h1">{supplier?.displayName ?? viewer.displayName}</h1>
          {supplier && (
            <p className="mt-0.5 text-small text-ink-2">
              {supplier.growingRegion}
              {supplier.growingAreaCode && (
                <>
                  {" "}
                  · Mã vùng trồng <strong className="font-semibold text-ink">{supplier.growingAreaCode}</strong>
                </>
              )}
            </p>
          )}
          {validCerts.length > 0 && (
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              {validCerts.map((c) => (
                <span
                  key={c.certificateNumber}
                  className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-caption font-semibold text-success"
                >
                  <ShieldCheck className="size-3.5" aria-hidden />
                  {CERT_LABELS[c.type]}
                </span>
              ))}
            </p>
          )}
        </div>
      </header>

      <SellerNav badges={{ batches: rejected.length, profile: certAttention }} />

      <div className="mt-5 md:mt-6">{children}</div>
    </div>
  );
}
