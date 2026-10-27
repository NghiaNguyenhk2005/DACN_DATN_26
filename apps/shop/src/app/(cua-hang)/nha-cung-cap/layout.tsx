import type { Metadata } from "next";
import Link from "next/link";
import { Factory, PlusCircle, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/farmery/empty-state";
import { getSupplier } from "@/lib/data";
import { isSeller, requireViewer } from "@/lib/data/account";
import { CERT_LABELS } from "@/lib/labels";
import { SellerNavTabs } from "./seller-nav-tabs";

export const metadata: Metadata = {
  title: "Khu nhà cung cấp",
  description: "Nhà cung cấp quản lý sản phẩm, khai báo lô thu hoạch, ghi nhật ký canh tác và lấy mã QR truy xuất.",
};

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
  const supplier = await getSupplier(viewer.supplierId!);
  const validCerts = supplier?.certifications.filter((c) => c.valid) ?? [];

  return (
    <div className="py-6 md:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-leaf-soft/40 via-surface to-surface p-6 shadow-xs md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 md:items-center md:gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md md:size-16">
              <Factory className="size-7 md:size-8" aria-hidden />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-h2 font-bold tracking-tight text-ink md:text-h1">
                  {supplier?.displayName ?? viewer.displayName}
                </h1>
                {validCerts.map((c) => (
                  <span
                    key={c.certificateNumber}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-semibold text-primary"
                  >
                    <ShieldCheck className="size-3.5" aria-hidden />
                    {CERT_LABELS[c.type]}
                  </span>
                ))}
              </div>
              {supplier && (
                <p className="mt-1 text-small text-ink-2 md:text-body">
                  {supplier.growingRegion}
                  {supplier.growingAreaCode && (
                    <>
                      {" "}
                      · Mã vùng trồng: <strong className="font-semibold text-ink">{supplier.growingAreaCode}</strong>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/nha-cung-cap/lo-hang/tao-moi"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-btn bg-cta px-4 text-small font-semibold text-white shadow-xs transition-colors hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              <PlusCircle className="size-4" aria-hidden />
              Khai báo lô mới
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-line/60 pt-4 md:mt-8">
          <SellerNavTabs />
        </div>
      </section>

      <div className="mt-6">{children}</div>
    </div>
  );
}
