"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  KeyRound,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import {
  confirmContractOtp,
  payWholesaleOrder,
  requestContractOtp,
  respondBuyerQuote,
} from "@/lib/data/wholesale-actions";
import { formatDateVi, formatQty, formatTimeVi, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type QuoteRequest = Schema<"QuoteRequest">;
type FilterTab = "all" | "need_action" | "active_contract" | "completed";

export function WholesaleBuyerClient({
  initialQuotes,
  buyerName,
  buyerPhone,
  buyerEmail,
}: {
  initialQuotes: QuoteRequest[];
  buyerName: string;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
}) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  // Modal / Inline State
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpDevHint, setOtpDevHint] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  const updateQuoteInState = (updated: QuoteRequest) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  // Hành động 1 vòng: Chấp nhận báo giá
  const handleAcceptQuote = (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    startTransition(async () => {
      const res = await respondBuyerQuote(id, "accept");
      setLoadingId(null);
      if (res.ok) {
        updateQuoteInState(res.data);
        setFeedback({ id, type: "success", text: "Đã chấp nhận báo giá. Hợp đồng mua bán sỉ mẫu đã được tạo!" });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  // Hành động 1 vòng: Từ chối báo giá
  const handleRejectQuote = (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    startTransition(async () => {
      const res = await respondBuyerQuote(id, "reject", rejectReason);
      setLoadingId(null);
      setRejectId(null);
      setRejectReason("");
      if (res.ok) {
        updateQuoteInState(res.data);
        setFeedback({ id, type: "success", text: "Đã từ chối báo giá và đóng yêu cầu mua sỉ." });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  // Yêu cầu phát OTP để ký hợp đồng
  const handleRequestOtp = (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    setOtpId(id);
    setOtpCode("");
    startTransition(async () => {
      const res = await requestContractOtp(id);
      setLoadingId(null);
      if (res.ok) {
        setOtpDevHint(res.data.devCode ?? "123456");
        setFeedback({ id, type: "success", text: res.data.message });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  // Xác thực OTP ký hợp đồng
  const handleConfirmOtp = (id: string) => {
    if (!otpCode.trim()) return;
    setLoadingId(id);
    setFeedback(null);
    startTransition(async () => {
      const res = await confirmContractOtp(id, otpCode);
      setLoadingId(null);
      if (res.ok) {
        updateQuoteInState(res.data);
        setOtpId(null);
        setOtpCode("");
        setFeedback({ id, type: "success", text: "Hợp đồng đã được giao kết thành công qua xác thực OTP!" });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  // Thanh toán qua PaymentService (DemoPaymentGateway)
  const handlePayOrder = (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    startTransition(async () => {
      const res = await payWholesaleOrder(id);
      setLoadingId(null);
      if (res.ok) {
        updateQuoteInState(res.data);
        setFeedback({
          id,
          type: "success",
          text: "Thanh toán thành công qua cổng thanh toán giả lập! Kế hoạch giao một đợt đã được kích hoạt.",
        });
      } else {
        setFeedback({ id, type: "error", text: res.message });
      }
    });
  };

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab === "need_action") return q.status === "quoted" || q.status === "accepted" || q.status === "confirmed";
    if (activeTab === "active_contract") return q.status === "confirmed" || q.status === "paid";
    if (activeTab === "completed") return q.status === "paid" || q.status === "completed" || q.status === "rejected";
    return true;
  });

  const countNeedAction = quotes.filter((q) => q.status === "quoted" || q.status === "accepted" || q.status === "confirmed").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Hồ sơ doanh nghiệp mua sỉ */}
      <section className="rounded-card border border-amber-200 bg-amber-50/50 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-btn bg-amber-600 text-white shadow-sm">
              <Building2 className="size-6" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-h3 font-bold text-ink">{buyerName}</h1>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-micro font-bold text-amber-900">
                  Đối tác B2B
                </span>
              </div>
              <p className="mt-0.5 text-small text-ink-2">
                {buyerEmail && <span>Email: {buyerEmail}</span>}
                {buyerPhone && <span className="ml-3">Hotline mua hàng: {buyerPhone}</span>}
              </p>
            </div>
          </div>
          <Link
            href="/danh-muc/trai-cay"
            className="rounded-btn bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Tìm sản phẩm & Hỏi giá sỉ
          </Link>
        </div>
        <p className="mt-3.5 border-t border-amber-200/70 pt-3 text-caption text-ink-2">
          Quy trình bán sỉ cam kết: <strong>Một vòng phản hồi giá</strong> dứt khoát, xác nhận giao kết bằng <strong>mã OTP</strong>, thanh toán qua cổng điện tử giả lập và <strong>giao một đợt</strong> tập trung tại kho trung chuyển.
        </p>
      </section>

      {/* Tabs lọc */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-btn px-3.5 py-1.5 text-small font-medium transition-colors",
            activeTab === "all" ? "bg-primary text-white" : "bg-surface-2 text-ink-2 hover:bg-line",
          )}
        >
          Tất cả yêu cầu ({quotes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("need_action")}
          className={cn(
            "flex items-center gap-1.5 rounded-btn px-3.5 py-1.5 text-small font-medium transition-colors",
            activeTab === "need_action" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200",
          )}
        >
          <span>Cần xử lý giá & Ký HĐ</span>
          {countNeedAction > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-danger text-micro font-bold text-white">
              {countNeedAction}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("active_contract")}
          className={cn(
            "rounded-btn px-3.5 py-1.5 text-small font-medium transition-colors",
            activeTab === "active_contract" ? "bg-primary text-white" : "bg-surface-2 text-ink-2 hover:bg-line",
          )}
        >
          Hợp đồng & Thanh toán
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "rounded-btn px-3.5 py-1.5 text-small font-medium transition-colors",
            activeTab === "completed" ? "bg-primary text-white" : "bg-surface-2 text-ink-2 hover:bg-line",
          )}
        >
          Đã xong / Đã đóng
        </button>
      </div>

      {/* Danh sách yêu cầu */}
      {filteredQuotes.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong p-8 text-center text-ink-2">
          <Package className="mx-auto size-10 text-subtle" aria-hidden />
          <p className="mt-2 text-title font-medium">Không có yêu cầu báo giá nào trong mục này.</p>
          <p className="mt-1 text-small text-subtle">
            Quý khách có thể vào trang chi tiết các sản phẩm nông sản và chuyển sang tab &quot;Mua sỉ&quot; để gửi yêu cầu báo giá theo bậc.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredQuotes.map((q) => {
            const isLoading = loadingId === q.id || pending;
            const itemFeedback = feedback?.id === q.id ? feedback : null;

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-card border bg-surface p-5 shadow-sm transition-all",
                  q.status === "quoted" ? "border-amber-400 ring-2 ring-amber-400/20" : "border-line",
                )}
              >
                {/* Header đơn */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-bold text-subtle">Mã RFQ: #{q.id}</span>
                      <span className="text-caption text-subtle">•</span>
                      <span className="text-caption text-subtle">{formatTimeVi(q.createdAt)}</span>
                    </div>
                    <h2 className="mt-1 text-title font-bold text-ink">{q.productName}</h2>
                    <p className="text-small text-ink-2">
                      Nhà cung cấp: <strong className="text-ink">{q.supplier.displayName}</strong>
                      {q.supplier.growingRegion && <span> — {q.supplier.growingRegion}</span>}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={q.status} />
                  </div>
                </div>

                {/* Thông tin nhu cầu ban đầu */}
                <div className="mt-3.5 grid grid-cols-2 gap-3 rounded-card bg-surface-2/40 p-3 text-small md:grid-cols-4">
                  <div>
                    <span className="block text-caption text-subtle">Sản lượng cần</span>
                    <span className="font-semibold text-ink">
                      {formatQty(q.quantity)} {q.saleUnit}
                    </span>
                  </div>
                  <div>
                    <span className="block text-caption text-subtle">Ngày cần hàng</span>
                    <span className="font-semibold text-ink">{formatDateVi(q.neededBy)}</span>
                  </div>
                  <div>
                    <span className="block text-caption text-subtle">Đơn giá bậc dự kiến</span>
                    <span className="font-semibold text-ink">
                      {q.estimatedUnitPrice ? `${formatVnd(q.estimatedUnitPrice)}/${q.saleUnit}` : "Theo báo giá"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-caption text-subtle">Tổng dự tính ban đầu</span>
                    <span className="font-semibold text-ink">
                      {q.estimatedUnitPrice ? formatVnd(q.estimatedUnitPrice * q.quantity) : "—"}
                    </span>
                  </div>
                </div>

                {q.note && (
                  <p className="mt-2.5 text-small text-ink-2 italic">
                    Ghi chú từ khách sỉ: &quot;{q.note}&quot;
                  </p>
                )}

                {/* BƯỚC 1: NHÀ CUNG CẤP PHẢN HỒI BÁO GIÁ 1 LƯỢT */}
                {q.status === "quoted" && q.quoteResponse && (
                  <div className="mt-4 rounded-card border border-emerald-300 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <FileCheck2 className="size-5" aria-hidden />
                      <h3 className="font-bold text-title">Báo giá chính thức từ Nhà cung cấp (1 lượt duy nhất)</h3>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-small md:grid-cols-4">
                      <div>
                        <span className="block text-caption text-emerald-900/70">Đơn giá đề xuất</span>
                        <span className="text-title font-bold text-emerald-900">
                          {formatVnd(q.quoteResponse.proposedPrice ?? 0)}/{q.saleUnit}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-emerald-900/70">Sản lượng đáp ứng</span>
                        <span className="font-semibold text-emerald-900">
                          {formatQty(q.quoteResponse.proposedQty ?? 0)} {q.saleUnit}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-emerald-900/70">Ngày giao cam kết</span>
                        <span className="font-semibold text-emerald-900">
                          {formatDateVi(q.quoteResponse.proposedDelivery ?? "")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-emerald-900/70">Tổng tiền đơn hàng</span>
                        <span className="text-title font-bold text-emerald-900">
                          {formatVnd((q.quoteResponse.proposedPrice ?? 0) * (q.quoteResponse.proposedQty ?? 0))}
                        </span>
                      </div>
                    </div>

                    {q.quoteResponse.note && (
                      <p className="mt-2 text-small text-emerald-900">
                        Lời nhắn: <em>&quot;{q.quoteResponse.note}&quot;</em>
                      </p>
                    )}

                    {/* Quyết định 1 vòng của khách sỉ */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-emerald-200 pt-3">
                      <Button
                        disabled={isLoading}
                        onClick={() => handleAcceptQuote(q.id)}
                        className="rounded-btn bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800"
                      >
                        {isLoading ? "Đang xử lý…" : "✓ Chấp nhận báo giá & Lập hợp đồng"}
                      </Button>

                      {rejectId === q.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nhập lý do từ chối (không bắt buộc)…"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 rounded-btn border border-line bg-surface px-3 py-1.5 text-small outline-none focus:border-danger"
                          />
                          <Button
                            disabled={isLoading}
                            variant="destructive"
                            onClick={() => handleRejectQuote(q.id)}
                            className="rounded-btn"
                          >
                            Xác nhận từ chối
                          </Button>
                          <Button variant="ghost" onClick={() => setRejectId(null)}>
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          disabled={isLoading}
                          variant="outline"
                          onClick={() => setRejectId(q.id)}
                          className="rounded-btn border-line text-danger hover:bg-danger/10"
                        >
                          ✕ Từ chối báo giá
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* BƯỚC 2: HỢP ĐỒNG MẪU & XÁC NHẬN GIAO KẾT BẰNG OTP */}
                {q.status === "accepted" && q.contract && (
                  <div className="mt-4 rounded-card border border-blue-200 bg-blue-50/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-blue-900">
                        <FileText className="size-5" aria-hidden />
                        <h3 className="font-bold text-title">Hợp đồng mua bán nông sản sỉ — Mã {q.contract.contractCode}</h3>
                      </div>
                      <span className="rounded-btn bg-blue-200/80 px-2.5 py-0.5 text-micro font-bold text-blue-900">
                        Chờ ký OTP
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-small md:grid-cols-4">
                      <div>
                        <span className="block text-caption text-blue-900/70">Số lượng hợp đồng</span>
                        <span className="font-semibold text-blue-950">
                          {formatQty(q.contract.agreedQty ?? 0)} {q.saleUnit}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-blue-900/70">Đơn giá chốt</span>
                        <span className="font-semibold text-blue-950">
                          {formatVnd(q.contract.agreedUnitPrice ?? 0)}/{q.saleUnit}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-blue-900/70">Tổng giá trị hợp đồng</span>
                        <span className="text-title font-bold text-blue-950">{formatVnd(q.contract.totalAmount ?? 0)}</span>
                      </div>
                      <div>
                        <span className="block text-caption text-blue-900/70">Giao hàng 1 đợt vào</span>
                        <span className="font-semibold text-blue-950">{formatDateVi(q.contract.deliveryDate ?? "")}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-micro text-blue-800">
                      Mã băm SHA-256 bảo mật văn bản: <code className="font-mono">{(q.contract.documentHash ?? "").slice(0, 24)}…</code>
                    </div>

                    {/* Vùng xác thực OTP */}
                    <div className="mt-4 border-t border-blue-200 pt-3">
                      {otpId === q.id ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2">
                            <KeyRound className="size-4 text-blue-900" aria-hidden />
                            <span className="text-small font-semibold text-blue-900">Nhập mã OTP 6 số:</span>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="123456"
                              className="w-28 rounded-btn border border-blue-300 bg-surface px-3 py-1.5 text-center font-mono font-bold tracking-widest text-ink outline-none focus:border-primary"
                            />
                          </label>
                          <Button
                            disabled={isLoading || otpCode.length < 6}
                            onClick={() => handleConfirmOtp(q.id)}
                            className="rounded-btn bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800"
                          >
                            {isLoading ? "Đang xác thực…" : "Ký xác nhận hợp đồng"}
                          </Button>
                          <Button variant="ghost" onClick={() => setOtpId(null)} className="text-small">
                            Hủy
                          </Button>
                          {otpDevHint && (
                            <span className="text-caption text-blue-900/80 italic">
                              (Mã demo: <strong>{otpDevHint}</strong>)
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          disabled={isLoading}
                          onClick={() => handleRequestOtp(q.id)}
                          className="rounded-btn bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800"
                        >
                          <KeyRound className="mr-1.5 size-4" aria-hidden />
                          Phát mã OTP & Ký giao kết hợp đồng
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* BƯỚC 3: HỢP ĐỒNG ĐÃ KÝ -> CHỜ THANH TOÁN PAYMENT SERVICE */}
                {q.status === "confirmed" && q.contract && (
                  <div className="mt-4 rounded-card border border-purple-200 bg-purple-50/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-purple-900">
                        <ShieldCheck className="size-5 text-emerald-600" aria-hidden />
                        <h3 className="font-bold text-title">
                          Hợp đồng {q.contract.contractCode} đã giao kết thành công qua OTP
                        </h3>
                      </div>
                      <span className="rounded-btn bg-emerald-100 px-2.5 py-0.5 text-micro font-bold text-emerald-800">
                        Đã ký điện tử
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 text-small">
                      <div>
                        <span className="text-caption text-purple-900/70">Số tiền cần thanh toán: </span>
                        <span className="text-h3 font-bold text-purple-950">{formatVnd(q.contract.totalAmount ?? 0)}</span>
                      </div>
                      <div className="text-caption text-purple-900/70">
                        Phương thức: Cổng thanh toán giả lập <strong>DemoPaymentGateway</strong>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-purple-200 pt-3">
                      <Button
                        disabled={isLoading}
                        onClick={() => handlePayOrder(q.id)}
                        className="rounded-btn bg-cta px-6 py-2.5 text-title font-semibold text-white hover:bg-cta-hover"
                      >
                        <CreditCard className="mr-2 size-5" aria-hidden />
                        {isLoading ? "Đang gọi PaymentService…" : "Thanh toán ngay qua DemoPaymentGateway"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* BƯỚC 4: ĐÃ THANH TOÁN -> KẾ HOẠCH GIAO HÀNG MỘT ĐỢT */}
                {(q.status === "paid" || q.status === "completed") && (
                  <div className="mt-4 rounded-card border border-teal-200 bg-teal-50/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-teal-900">
                        <CheckCircle2 className="size-5 text-teal-600" aria-hidden />
                        <h3 className="font-bold text-title">Đơn hàng sỉ đã thanh toán — Giao một đợt</h3>
                      </div>
                      <span className="rounded-btn bg-teal-200 px-2.5 py-0.5 text-micro font-bold text-teal-900">
                        Đã thanh toán
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-small md:grid-cols-4">
                      <div>
                        <span className="block text-caption text-teal-900/70">Mã giao dịch</span>
                        <span className="font-mono font-semibold text-teal-950">
                          {q.payment?.reference ?? "PAY-WS-" + q.id}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption text-teal-900/70">Đã thanh toán</span>
                        <span className="font-bold text-teal-950">{formatVnd(q.payment?.amount ?? 0)}</span>
                      </div>
                      <div>
                        <span className="block text-caption text-teal-900/70">Phương thức giao</span>
                        <span className="font-semibold text-teal-950">Giao 1 đợt tập trung</span>
                      </div>
                      <div>
                        <span className="block text-caption text-teal-900/70">Ngày giao cam kết</span>
                        <span className="font-semibold text-teal-950">
                          {formatDateVi(q.delivery?.deliveryDate ?? q.neededBy)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-small text-teal-900">
                      <Truck className="size-4 flex-none text-teal-700" aria-hidden />
                      <span>
                        Địa điểm giao hàng: <strong>{q.delivery?.warehouseHub ?? "Kho trung chuyển Farmery"}</strong>. Xe vận chuyển chuyên dụng đang chuẩn bị chuyến.
                      </span>
                    </div>
                  </div>
                )}

                {/* ĐƠN BỊ TỪ CHỐI */}
                {q.status === "rejected" && (
                  <div className="mt-4 rounded-card border border-danger/30 bg-danger-soft/40 p-3.5 text-small text-danger">
                    <div className="flex items-center gap-2 font-bold">
                      <XCircle className="size-4" aria-hidden />
                      Yêu cầu báo giá đã đóng (Khách sỉ từ chối)
                    </div>
                    {q.rejectReason && <p className="mt-1 text-ink-2">Lý do: {q.rejectReason}</p>}
                  </div>
                )}

                {/* Feedback thông báo lỗi / thành công */}
                {itemFeedback && (
                  <div
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-btn px-3 py-2 text-small",
                      itemFeedback.type === "success"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-rose-100 text-rose-900",
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-micro font-medium text-slate-700">
          <Clock className="size-3" aria-hidden /> Chờ NCC báo giá
        </span>
      );
    case "quoted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-micro font-bold text-amber-900">
          <AlertCircle className="size-3" aria-hidden /> Đã có báo giá phản hồi
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-micro font-bold text-blue-900">
          <FileText className="size-3" aria-hidden /> Đã chấp thuận · Chờ ký OTP
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-micro font-bold text-purple-900">
          <CreditCard className="size-3" aria-hidden /> Đã ký HĐ · Chờ thanh toán
        </span>
      );
    case "paid":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-micro font-bold text-teal-900">
          <Truck className="size-3" aria-hidden /> Đã thanh toán · Giao 1 đợt
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-micro font-medium text-rose-800">
          <XCircle className="size-3" aria-hidden /> Đã từ chối
        </span>
      );
    default:
      return null;
  }
}
