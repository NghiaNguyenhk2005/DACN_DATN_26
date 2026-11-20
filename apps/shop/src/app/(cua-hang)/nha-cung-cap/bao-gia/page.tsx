import type { Metadata } from "next";
import { getSellerQuoteRequests } from "@/lib/data/seller";
import { SellerQuotesClient } from "./seller-quotes-client";

export const metadata: Metadata = { title: "Yêu cầu báo giá sỉ — Nhà cung cấp" };

/** Yêu cầu báo giá sỉ gửi tới nhà cung cấp (FR6.1, FR6.2). Nhà cung cấp phản hồi báo giá 1 lượt. */
export default async function SellerQuotesPage() {
  const quotes = await getSellerQuoteRequests();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-h2-sm font-bold text-ink md:text-h2">Yêu cầu báo giá sỉ</h2>
        <p className="mt-1 text-small text-ink-2">
          Doanh nghiệp mua sỉ hỏi giá theo bảng giá sỉ của bạn. Hệ thống áp dụng <strong>một vòng phản hồi giá</strong> dứt khoát: nhập đơn giá, sản lượng và ngày giao để gửi lại cho bên mua.
        </p>
      </div>
      {quotes.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
          Chưa có yêu cầu báo giá nào từ các doanh nghiệp mua sỉ.
        </p>
      ) : (
        <SellerQuotesClient initialQuotes={quotes} />
      )}
    </div>
  );
}
