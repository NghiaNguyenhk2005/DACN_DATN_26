"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import { sellerRespondQuote } from "@/lib/data/wholesale-actions";
import { formatDateVi, formatQty, formatTimeVi, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type QuoteRequest = Schema<"QuoteRequest">;

export function SellerQuotesClient({ initialQuotes }: { initialQuotes: QuoteRequest[] }) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  // Form inputs for 1-turn quote
  const [price, setPrice] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleOpenForm = (q: QuoteRequest) => {
    setActiveFormId(q.id);
    setPrice(q.estimatedUnitPrice ? String(q.estimatedUnitPrice) : "");
    setQty(String(q.quantity));
    setDeliveryDate(q.neededBy);
    setNote("");
    setFeedback(null);
  };

  const handleSubmitQuote = (id: string) => {
    const p = Number(price);
    const numQty = Number(qty);
    if (!p || p <= 0 || !numQty || numQty <= 0 || !deliveryDate) {
      setFeedback({ id, type: "error", text: "Vui lòng nhập đầy đủ đơn giá, sản lượng và ngày giao." });
      return;
    }

    setLoadingId(id);
    setFeedback(null);
    startTransition(async () => {
      const res = await sellerRespondQuote(id, {
        proposedPrice: p,
        proposedQty: numQty,
        proposedDelivery: deliveryDate,
        note: note.trim() || undefined,
      });
      setLoadingId(null);
      if (res.ok) {
        setQuotes((prev) => prev.map((item) => (item.id === id ? res.data : item)));
        setActiveFormId(null);
        setFeedback({ id, type: "success", text: "Đã gửi báo giá phản hồi 1 lượt tới doanh nghiệp mua sỉ!" });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  return (
    <ul className="flex flex-col gap-4">
      {quotes.map((q) => {
        const isResponding = activeFormId === q.id;
        const isLoading = loadingId === q.id || pending;
        const itemFeedback = feedback?.id === q.id ? feedback : null;

        return (
          <li key={q.id} className="rounded-card border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2.5">
              <div>
                <span className="text-caption font-bold text-subtle">Mã RFQ: #{q.id}</span>
                <h3 className="text-title font-semibold text-ink">{q.buyerName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <SellerStatusBadge status={q.status} />
                <span className="text-caption text-subtle">Gửi lúc {formatTimeVi(q.createdAt)}</span>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-small md:grid-cols-4">
              <div>
                <dt className="text-caption text-subtle">Sản phẩm</dt>
                <dd className="font-semibold text-ink">{q.productName}</dd>
              </div>
              <div>
                <dt className="text-caption text-subtle">Sản lượng yêu cầu</dt>
                <dd className="font-medium text-ink">
                  {formatQty(q.quantity)} {q.saleUnit}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-subtle">Ngày cần hàng</dt>
                <dd className="font-medium text-ink">{formatDateVi(q.neededBy)}</dd>
              </div>
              <div>
                <dt className="text-caption text-subtle">Đơn giá bậc dự kiến</dt>
                <dd className="font-medium text-ink">
                  {q.estimatedUnitPrice !== null ? `${formatVnd(q.estimatedUnitPrice)}/${q.saleUnit}` : "—"}
                </dd>
              </div>
            </dl>

            {q.note && <p className="mt-2.5 rounded-tile bg-surface-2/60 px-3 py-2 text-small text-ink-2">“{q.note}”</p>}

            {/* Khi ở trạng thái "sent": Nhà cung cấp có nút phản hồi báo giá 1 lượt */}
            {q.status === "sent" && !isResponding && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-caption text-subtle">
                  Quy trình bán sỉ áp dụng 1 vòng báo giá duy nhất. Vui lòng cân đối mức giá và ngày giao tốt nhất.
                </span>
                <Button
                  onClick={() => handleOpenForm(q)}
                  className="rounded-btn bg-primary px-4 py-1.5 text-small font-semibold text-white hover:bg-primary-hover"
                >
                  <Send className="mr-1.5 size-4" aria-hidden /> Phản hồi báo giá (1 lượt)
                </Button>
              </div>
            )}

            {/* Form phản hồi báo giá 1 lượt */}
            {q.status === "sent" && isResponding && (
              <div className="mt-4 rounded-card border border-primary/30 bg-primary/5 p-4">
                <h4 className="text-small font-bold text-primary">Gửi báo giá phản hồi chính thức (1 lượt duy nhất)</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-caption font-medium text-ink">
                    Đơn giá đề xuất (VNĐ/{q.saleUnit}) *
                    <input
                      type="number"
                      min={1000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="vd: 52000"
                      className="rounded-btn border border-line bg-surface px-3 py-2 text-small outline-none focus:border-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-caption font-medium text-ink">
                    Sản lượng đáp ứng ({q.saleUnit}) *
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder={String(q.quantity)}
                      className="rounded-btn border border-line bg-surface px-3 py-2 text-small outline-none focus:border-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-caption font-medium text-ink">
                    Ngày giao đề xuất *
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="rounded-btn border border-line bg-surface px-3 py-2 text-small outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <label className="mt-2.5 flex flex-col gap-1 text-caption font-medium text-ink">
                  Ghi chú cho bên mua (quy cách, bao bì, điều kiện giao...)
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="vd: Bao bì sọt nhựa 20kg có lót xốp, giao tại kho trung chuyển Farmery..."
                    className="rounded-btn border border-line bg-surface px-3 py-2 text-small outline-none focus:border-primary"
                  />
                </label>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    disabled={isLoading}
                    onClick={() => handleSubmitQuote(q.id)}
                    className="rounded-btn bg-primary px-4 py-1.5 text-small font-semibold text-white hover:bg-primary-hover"
                  >
                    {isLoading ? "Đang gửi báo giá…" : "Gửi báo giá cho khách sỉ"}
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveFormId(null)} className="text-small">
                    Đóng lại
                  </Button>
                </div>
              </div>
            )}

            {/* Thông tin báo giá đã phản hồi */}
            {q.quoteResponse && (
              <div className="mt-3 rounded-card bg-surface-2/40 p-3 text-small">
                <span className="block text-caption font-bold text-primary">Báo giá bạn đã gửi (1 lượt):</span>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ink">
                  <span>
                    Đơn giá: <strong>{formatVnd(q.quoteResponse.proposedPrice ?? 0)}/{q.saleUnit}</strong>
                  </span>
                  <span>
                    Sản lượng: <strong>{formatQty(q.quoteResponse.proposedQty ?? 0)} {q.saleUnit}</strong>
                  </span>
                  <span>
                    Ngày giao: <strong>{formatDateVi(q.quoteResponse.proposedDelivery ?? "")}</strong>
                  </span>
                </div>
                {q.quoteResponse.note && (
                  <p className="mt-1 text-caption text-ink-2 italic">“{q.quoteResponse.note}”</p>
                )}
              </div>
            )}

            {/* Hợp đồng / Thanh toán / Giao hàng */}
            {q.contract && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-2">
                <span>Mã hợp đồng: <strong className="text-ink">{q.contract.contractCode}</strong></span>
                <span>Tổng giá trị: <strong className="text-ink">{formatVnd(q.contract.totalAmount ?? 0)}</strong></span>
                <span>Trạng thái HĐ: <strong className="text-ink">{q.contract.status === "concluded" ? "Đã ký qua OTP" : "Bản nháp chờ khách ký"}</strong></span>
              </div>
            )}

            {q.payment && (
              <div className="mt-1.5 text-small text-teal-800">
                ✓ Khách sỉ đã thanh toán {formatVnd(q.payment.amount ?? 0)} (Mã GD: {q.payment.reference})
              </div>
            )}

            {itemFeedback && (
              <div
                className={cn(
                  "mt-3 flex items-center gap-2 rounded-btn px-3 py-2 text-small",
                  itemFeedback.type === "success" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900",
                )}
              >
                {itemFeedback.type === "success" ? (
                  <CheckCircle2 className="size-4 flex-none" aria-hidden />
                ) : (
                  <AlertCircle className="size-4 flex-none" aria-hidden />
                )}
                <span>{itemFeedback.text}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SellerStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-micro font-bold text-amber-900">
          <Clock className="size-3" aria-hidden /> Cần báo giá
        </span>
      );
    case "quoted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-micro font-medium text-blue-900">
          <FileCheck2 className="size-3" aria-hidden /> Đã báo giá · Chờ khách
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-micro font-bold text-indigo-900">
          <FileText className="size-3" aria-hidden /> Khách đồng ý · Chờ ký OTP
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-micro font-bold text-purple-900">
          <CreditCard className="size-3" aria-hidden /> Đã ký HĐ · Chờ thanh toán
        </span>
      );
    case "paid":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-micro font-bold text-teal-900">
          <Truck className="size-3" aria-hidden /> Đã thanh toán · Giao 1 đợt
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-micro font-medium text-rose-800">
          <XCircle className="size-3" aria-hidden /> Khách từ chối
        </span>
      );
    default:
      return null;
  }
}
