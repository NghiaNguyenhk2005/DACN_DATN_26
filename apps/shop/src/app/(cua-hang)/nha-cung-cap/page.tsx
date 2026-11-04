import Link from "next/link";
import { AlertCircle, ArrowRight, MessageSquareQuote, ShieldAlert } from "lucide-react";
import { ReviewStatusBadge } from "@/components/farmery/status-badge";
import { getSellerBatches, getSellerCertifications, getSellerProducts, getSellerQuoteRequests } from "@/lib/data/seller";
import { certValidity, daysBetween, todayVn } from "@/lib/decision";
import { formatDateVi, formatQty } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";

type Todo = { href: string; tone: "danger" | "warning" | "info"; icon: typeof AlertCircle; title: string; detail: string };

const TODO_TONE = {
  danger: "border-danger-line bg-danger-soft text-danger-ink",
  warning: "border-warning-line bg-warning-soft text-ink",
  info: "border-line bg-surface text-ink",
};

/** Tổng quan khu nhà cung cấp (design/05 N1): việc cần làm → số liệu nhanh → lô gần đây → quy trình (khi chưa có lô). */
export default async function SellerOverviewPage() {
  const [products, batches, certs, quotes] = await Promise.all([
    getSellerProducts(),
    getSellerBatches(),
    getSellerCertifications().catch(() => []),
    getSellerQuoteRequests().catch(() => []),
  ]);
  const today = todayVn();
  const units = new Map(products.map((p) => [p.id, p.unit]));

  const todos: Todo[] = [
    ...batches
      .filter((b) => b.status === "rejected")
      .map((b): Todo => ({
        href: `/nha-cung-cap/lo-hang/${b.id}`,
        tone: "danger",
        icon: AlertCircle,
        title: `Lô ${b.batchCode} bị từ chối`,
        detail: b.rejectReason ?? "Xem lý do và bổ sung thông tin.",
      })),
    ...certs
      .filter((c) => c.status === "approved" && certValidity(c, today) !== "valid")
      .map((c): Todo => {
        const days = daysBetween(today, c.expiryDate);
        return {
          href: "/nha-cung-cap/ho-so",
          tone: days < 0 ? "danger" : "warning",
          icon: ShieldAlert,
          title: `Chứng nhận ${CERT_LABELS[c.type]} ${days < 0 ? "đã hết hiệu lực" : `còn ${days} ngày hiệu lực`}`,
          detail: "Khai báo chứng nhận mới để nhãn chứng nhận tiếp tục hiện trên sản phẩm.",
        };
      }),
    ...(quotes.length > 0
      ? [
          {
            href: "/nha-cung-cap/bao-gia",
            tone: "info" as const,
            icon: MessageSquareQuote,
            title: `${quotes.length} yêu cầu báo giá sỉ`,
            detail: `Mới nhất: ${quotes[0]!.buyerName} hỏi ${formatQty(quotes[0]!.quantity)} ${quotes[0]!.saleUnit} ${quotes[0]!.productName}.`,
          },
        ]
      : []),
  ];

  const stats = [
    { label: "Sản phẩm", value: products.length, href: "/nha-cung-cap/san-pham" },
    { label: "Lô đang bán", value: batches.filter((b) => b.status === "approved" && !b.recalledAt).length, href: "/nha-cung-cap/lo-hang?status=approved" },
    { label: "Chờ duyệt", value: batches.filter((b) => b.status === "pending_review").length, href: "/nha-cung-cap/lo-hang?status=pending_review" },
    { label: "Bị từ chối", value: batches.filter((b) => b.status === "rejected").length, href: "/nha-cung-cap/lo-hang?status=rejected" },
  ];

  return (
    <div className="flex flex-col gap-7">
      {todos.length > 0 && (
        <section aria-labelledby="viec-can-lam">
          <h2 id="viec-can-lam" className="mb-3 text-h2-sm font-bold text-ink md:text-h2">
            Việc cần làm
          </h2>
          <ul className="flex flex-col gap-2.5">
            {todos.map((t) => (
              <li key={t.href + t.title}>
                <Link href={t.href} className={`flex items-start gap-3 rounded-card border px-4 py-3.5 hover:text-inherit ${TODO_TONE[t.tone]}`}>
                  <t.icon className="mt-0.5 size-5 flex-none" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-title font-semibold">{t.title}</span>
                    <span className="mt-0.5 block text-small text-ink-2">{t.detail}</span>
                  </span>
                  <ArrowRight className="mt-0.5 size-4 flex-none text-ink-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Số liệu nhanh" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-card border border-line px-4 py-3.5 text-ink hover:border-primary hover:text-ink">
            <span className="block text-small text-ink-2">{s.label}</span>
            <span className="mt-1 block text-h1 font-bold">{s.value}</span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="lo-gan-day">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="lo-gan-day" className="text-h2-sm font-bold text-ink md:text-h2">
            Lô gần đây
          </h2>
          <Link href="/nha-cung-cap/lo-hang" className="text-small font-semibold">
            Xem tất cả
          </Link>
        </div>
        {batches.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
            <p className="mb-3 font-semibold text-ink">Chưa có lô nào. Ba bước để bắt đầu bán:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Khai báo lô thu hoạch: ngày thu hoạch, hạn sử dụng, sản lượng.</li>
              <li>Kiểm duyệt viên xem lô, nhật ký và chứng nhận — thường trong 48 giờ.</li>
              <li>Lô được duyệt có mã QR để in tem; ghi tiếp nhật ký canh tác cho người mua xem.</li>
            </ol>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line">
            {batches.slice(0, 5).map((b) => (
              <li key={b.id}>
                <Link href={`/nha-cung-cap/lo-hang/${b.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-ink hover:bg-surface hover:text-ink">
                  <span className="font-mono text-small font-semibold">{b.batchCode}</span>
                  <span className="min-w-0 flex-1 basis-48 text-small text-ink-2">{b.productName}</span>
                  <span className="text-caption text-ink-2">
                    {formatQty(b.declaredQuantity)} {units.get(b.productId) ?? ""} · thu hoạch {formatDateVi(b.harvestDate)}
                  </span>
                  <ReviewStatusBadge status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
