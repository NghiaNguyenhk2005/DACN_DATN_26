import type { Metadata } from "next";
import { getSellerQuoteRequests } from "@/lib/data/seller";
import { formatDateVi, formatQty, formatTimeVi, formatVnd } from "@/lib/format";

export const metadata: Metadata = { title: "Yêu cầu báo giá sỉ" };

/** Yêu cầu báo giá sỉ gửi tới nhà cung cấp (FR6.1). Phản hồi báo giá, thương lượng thuộc MVP. */
export default async function SellerQuotesPage() {
  const quotes = await getSellerQuoteRequests();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-h2-sm font-bold text-ink md:text-h2">Yêu cầu báo giá sỉ</h2>
        <p className="mt-1 text-small text-ink-2">
          Doanh nghiệp mua sỉ hỏi giá theo bảng giá sỉ của bạn. Phản hồi báo giá trên Farmery sẽ có ở bản chính thức; hiện liên hệ
          trực tiếp theo thông tin trong yêu cầu.
        </p>
      </div>
      {quotes.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">Chưa có yêu cầu báo giá nào.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-card border border-line p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-title font-semibold text-ink">{q.buyerName}</h3>
                <span className="text-caption text-ink-2">Gửi lúc {formatTimeVi(q.createdAt)}</span>
              </div>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-small md:grid-cols-4">
                <div>
                  <dt className="text-caption text-subtle">Sản phẩm</dt>
                  <dd className="font-medium text-ink">{q.productName}</dd>
                </div>
                <div>
                  <dt className="text-caption text-subtle">Sản lượng</dt>
                  <dd className="font-medium text-ink">
                    {formatQty(q.quantity)} {q.saleUnit}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-subtle">Ngày cần hàng</dt>
                  <dd className="font-medium text-ink">{formatDateVi(q.neededBy)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-subtle">Đơn giá theo bảng giá sỉ</dt>
                  <dd className="font-medium text-ink">{q.estimatedUnitPrice !== null ? `${formatVnd(q.estimatedUnitPrice)}/${q.saleUnit}` : "—"}</dd>
                </div>
              </dl>
              {q.note && <p className="mt-2.5 rounded-tile bg-surface px-3 py-2 text-small text-ink-2">“{q.note}”</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
