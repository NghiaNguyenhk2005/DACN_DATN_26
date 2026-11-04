"use client";

import { useState } from "react";
import { Clock, CreditCard, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import { LOW_STOCK, quantityRule } from "@/lib/decision";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FeedbackText, useAddToCart } from "./add-to-cart";
import { QuantityInput } from "./quantity-input";
import { SafeImage } from "./safe-image";
import { WholesalePanel } from "./wholesale-panel";

interface Props {
  /** null khi chưa có tin bán đang mở */
  listing: {
    id: string;
    unitPrice: number;
    saleUnit: string;
    available: number;
  } | null;
  seller: { name: string; region: string; avatarUrl?: string | null };
  productId: string;
  /** Bảng giá sỉ của nhà cung cấp; có thì khung mua có nút gạt Mua lẻ | Mua sỉ */
  wholesale?: Schema<"WholesaleOffer"> | null;
  /** Câu ước tính giao, tính phía máy chủ */
  deliveryNote: string;
}

type Mode = "retail" | "wholesale";

function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const opt = (m: Mode, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "flex-1 rounded-[7px] py-2 text-title font-medium text-ink-2 transition-colors",
        mode === m && "bg-background font-semibold text-primary shadow-segment",
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="Cách mua" className="mb-4 flex gap-1 rounded-btn bg-surface p-1">
      {opt("retail", "Mua lẻ")}
      {opt("wholesale", "Mua sỉ")}
    </div>
  );
}

/**
 * Khung mua. ≥lg: thẻ cột phải 300px; <lg: thanh dính đáy [số lượng] [giỏ] [Mua ngay + tạm tính] (trang chừa pb-28).
 * Thêm vào giỏ ở lại trang; Mua ngay thêm vào giỏ rồi sang /thanh-toan.
 */
export function BuyBox({ listing, seller, productId, wholesale, deliveryNote }: Props) {
  const [mode, setMode] = useState<Mode>(listing || !wholesale ? "retail" : "wholesale");
  const [qty, setQty] = useState(1);
  const [qtyNote, setQtyNote] = useState<string | null>(null);
  const max = listing ? listing.available : 1;
  const byWeight = listing ? quantityRule(listing.saleUnit).byWeight : false;
  const onQty = (n: number, note: string | null) => {
    setQty(n);
    setQtyNote(note);
  };
  const soldOut = !listing || listing.available <= 0;
  const total = listing ? Math.round(listing.unitPrice * qty) : 0;
  const { add, pending, feedback } = useAddToCart();
  const buy = (buyNow: boolean) => listing && add(listing.id, qty, buyNow);
  const lowStock = listing && !soldOut && listing.available <= LOW_STOCK;

  return (
    <>
      <aside className="hidden lg:block" aria-label="Mua hàng">
        <div className="mb-3.5 rounded-panel border border-border p-5">
          <div className="mb-3.5 flex items-center gap-[11px]">
            <span className="relative size-[42px] flex-none overflow-hidden rounded-[9px]">
              <SafeImage src={seller.avatarUrl} alt="" fill sizes="42px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="text-body font-bold text-ink">{seller.name}</p>
              <p className="truncate text-micro text-muted-foreground">{seller.region}</p>
            </div>
          </div>
          {wholesale && <ModeSwitch mode={mode} setMode={setMode} />}
          {mode === "wholesale" && wholesale ? (
            <WholesalePanel offer={wholesale} productId={productId} supplierName={seller.name} />
          ) : (
            <>
              {listing && (
                <>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-small text-ink-2">Số lượng ({listing.saleUnit})</span>
                    <QuantityInput value={qty} onChange={onQty} saleUnit={listing.saleUnit} max={max} label="số lượng" disabled={soldOut} />
                  </div>
                  <p className={`mb-3 min-h-4 text-right text-micro ${qtyNote ? "text-warning" : "text-muted-foreground"}`} role="status">
                    {qtyNote ?? (byWeight ? "Bán theo cân, nhập lẻ được (vd 1,5 kg)" : "")}
                  </p>
                  <div className="mb-4 flex items-center justify-between text-small text-ink-2">
                    <span>Tạm tính</span>
                    <span className="text-[17px] font-bold text-ink">{formatVnd(total)}</span>
                  </div>
                </>
              )}
              <div className="flex flex-col gap-[9px]">
                <Button
                  disabled={soldOut || pending}
                  onClick={() => buy(true)}
                  className="h-auto rounded-btn bg-cta py-3 text-title font-semibold text-white hover:bg-cta-hover"
                >
                  {soldOut ? "Tạm hết hàng" : "Mua ngay"}
                </Button>
                <Button
                  variant="outline"
                  disabled={soldOut || pending}
                  onClick={() => buy(false)}
                  className="h-auto rounded-btn border-[1.5px] border-primary py-3 text-title font-semibold text-primary hover:bg-surface hover:text-primary"
                >
                  {pending ? "Đang xử lý…" : "Thêm vào giỏ"}
                </Button>
                {lowStock && (
                  <p className="text-center text-caption font-semibold text-warning">
                    Chỉ còn {listing!.available.toLocaleString("vi-VN")} {listing!.saleUnit}
                  </p>
                )}
                <FeedbackText feedback={feedback} className="min-h-4 text-center" />
              </div>
            </>
          )}
        </div>
        {mode === "retail" && (
          <ul className="flex flex-col gap-[11px] rounded-card border border-line px-[18px] py-4 text-caption leading-[1.5] text-ink-2">
            <li className="flex gap-2.5 font-medium text-ink">
              <Clock className="mt-px size-[17px] flex-none text-primary" aria-hidden />
              {deliveryNote}
            </li>
            <li className="flex gap-2.5">
              <Truck className="mt-px size-[17px] flex-none text-primary" aria-hidden />
              Giao tại TP.HCM theo khung giờ 8–11h, 14–17h hoặc 18–21h; miễn phí giao từ 300.000₫
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-px size-[17px] flex-none text-primary" aria-hidden />
              Hoàn tiền phần hư hỏng khi gửi ảnh trong 24 giờ
            </li>
            <li className="flex gap-2.5">
              <CreditCard className="mt-px size-[17px] flex-none text-primary" aria-hidden />
              Thanh toán trực tuyến hoặc tiền mặt khi nhận (đơn tới 1.000.000₫)
            </li>
          </ul>
        )}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        {feedback ? (
          <FeedbackText
            feedback={feedback}
            className="absolute inset-x-0 bottom-full border-t border-border bg-background px-4 py-2 text-center text-small"
          />
        ) : (
          qtyNote && (
            <p role="status" className="absolute inset-x-0 bottom-full border-t border-border bg-background px-4 py-2 text-center text-small text-warning">
              {qtyNote}
            </p>
          )
        )}
        {listing && (
          <QuantityInput value={qty} onChange={onQty} saleUnit={listing.saleUnit} max={max} label="số lượng" disabled={soldOut} className="h-[46px]" />
        )}
        <Button
          variant="outline"
          disabled={soldOut || pending}
          onClick={() => buy(false)}
          aria-label="Thêm vào giỏ"
          className="size-[46px] rounded-btn border-[1.5px] border-primary p-0 text-primary hover:bg-surface"
        >
          <ShoppingBag className="size-[22px]" />
        </Button>
        <Button
          disabled={soldOut || pending}
          onClick={() => buy(true)}
          className="h-[46px] flex-1 flex-col gap-0 rounded-btn bg-cta leading-[1.15] text-white hover:bg-cta-hover"
        >
          <span className="text-title font-semibold">{soldOut ? "Tạm hết hàng" : "Mua ngay"}</span>
          {!soldOut && <span className="text-[12px] font-normal">{formatVnd(total)}</span>}
        </Button>
      </div>
    </>
  );
}
