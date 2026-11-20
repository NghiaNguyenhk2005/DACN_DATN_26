import type { Metadata } from "next";
import Link from "next/link";
import { Building2, LogIn, ShieldAlert } from "lucide-react";
import { requireViewer } from "@/lib/data/account";
import { getBuyerQuoteRequests } from "@/lib/data/wholesale-actions";
import { WholesaleBuyerClient } from "./wholesale-buyer-client";

export const metadata: Metadata = {
  title: "Khu khách sỉ — Doanh nghiệp mua sỉ",
};

export default async function WholesaleBuyerPage() {
  const viewer = await requireViewer("/khach-si");

  // Kiểm tra vai trò doanh nghiệp mua sỉ
  if (!viewer.roles.includes("buyer_wholesale")) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-800">
          <ShieldAlert className="size-8" aria-hidden />
        </div>
        <h1 className="mt-4 text-h2 font-bold text-ink">Yêu cầu quyền Doanh nghiệp mua sỉ</h1>
        <p className="mt-2 text-title text-ink-2">
          Khu khách sỉ chỉ dành riêng cho tài khoản doanh nghiệp mua sỉ (B2B) đã xác minh để hỏi giá theo bậc, nhận báo giá phản hồi 1 lượt, ký hợp đồng mẫu và thanh toán đơn hàng số lượng lớn.
        </p>
        <div className="mt-6 rounded-card border border-amber-200 bg-amber-50/70 p-4 text-left text-small text-amber-950">
          <p className="font-semibold">Trải nghiệm bằng tài khoản doanh nghiệp mẫu:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Email: <code className="font-mono font-bold">khachsi@example.com</code></li>
            <li>Tên đối tác: <strong>GreenMart — Phòng thu mua</strong></li>
            <li>Mã OTP đăng nhập (demo): <code className="font-mono font-bold">123456</code></li>
          </ul>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dang-nhap?next=/khach-si"
            className="inline-flex items-center gap-2 rounded-btn bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-hover"
          >
            <LogIn className="size-4" aria-hidden /> Đăng nhập tài khoản sỉ mẫu
          </Link>
          <Link
            href="/"
            className="rounded-btn border border-line bg-surface px-5 py-2.5 font-semibold text-ink hover:bg-surface-2"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const quotes = await getBuyerQuoteRequests();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-btn bg-amber-600/10 text-amber-800">
          <Building2 className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-h2-sm font-bold text-ink md:text-h2">Khu khách sỉ — Doanh nghiệp</h1>
          <p className="text-small text-ink-2">
            Quản lý yêu cầu báo giá nông sản sỉ, nhận phản hồi giá 1 lượt từ nhà cung cấp, ký kết hợp đồng và thanh toán giao dịch.
          </p>
        </div>
      </div>

      <WholesaleBuyerClient
        initialQuotes={quotes}
        buyerName={viewer.displayName}
        buyerPhone={viewer.phone}
        buyerEmail={viewer.email}
      />
    </div>
  );
}

