"use client";

import { useState } from "react";
import { CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { SafeImage } from "./safe-image";

interface Props {
  /** null khi chưa có tin bán đang mở */
  listing: { unitPrice: number; saleUnit: string; available: number } | null;
  seller: { name: string; region: string; avatarUrl?: string | null };
}

function Qty({ qty, setQty, max, className = "" }: { qty: number; setQty: (n: number) => void; max: number; className?: string }) {
  return (
    <div className={`flex items-center rounded-btn border border-border ${className}`}>
      <button
        type="button"
        aria-label="Giảm"
        disabled={qty <= 1}
        onClick={() => setQty(Math.max(1, qty - 1))}
        className="grid size-11 place-items-center text-ink-2 disabled:opacity-40 md:size-9"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-6 text-center text-body font-semibold md:min-w-[34px]" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Tăng"
        disabled={qty >= max}
        onClick={() => setQty(Math.min(max, qty + 1))}
        className="grid size-11 place-items-center text-ink-2 disabled:opacity-40 md:size-9"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/**
 * Khung mua. ≥lg: thẻ cột phải 300px; <lg: thanh dính đáy [số lượng] [giỏ] [Mua ngay + tạm tính] (trang chừa pb-28).
 * Nút Mua ngay, Thêm vào giỏ đúng vị trí thiết kế, chưa nối giỏ hàng.
 */
export function BuyBox({ listing, seller }: Props) {
  const [qty, setQty] = useState(1);
  const max = listing ? Math.max(1, Math.floor(listing.available)) : 1;
  const soldOut = !listing || listing.available <= 0;
  const total = listing ? listing.unitPrice * qty : 0;

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
          {listing && (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-small text-ink-2">Số lượng ({listing.saleUnit})</span>
                <Qty qty={qty} setQty={setQty} max={max} />
              </div>
              <div className="mb-4 flex items-center justify-between text-small text-ink-2">
                <span>Tạm tính</span>
                <span className="text-[17px] font-bold text-ink">{formatVnd(total)}</span>
              </div>
            </>
          )}
          <div className="flex flex-col gap-[9px]">
            <Button
              disabled={soldOut}
              className="h-auto rounded-btn bg-cta py-3 text-title font-semibold text-white hover:bg-cta-hover"
            >
              {soldOut ? "Tạm hết hàng" : "Mua ngay"}
            </Button>
            <Button
              variant="outline"
              disabled={soldOut}
              className="h-auto rounded-btn border-[1.5px] border-primary py-3 text-title font-semibold text-primary hover:bg-surface hover:text-primary"
            >
              Thêm vào giỏ
            </Button>
          </div>
        </div>
        <ul className="flex flex-col gap-[11px] rounded-card border border-line px-[18px] py-4 text-caption leading-[1.5] text-ink-2">
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
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        {listing && <Qty qty={qty} setQty={setQty} max={max} className="h-[46px]" />}
        <Button
          variant="outline"
          disabled={soldOut}
          aria-label="Thêm vào giỏ"
          className="size-[46px] rounded-btn border-[1.5px] border-primary p-0 text-primary hover:bg-surface"
        >
          <ShoppingBag className="size-[22px]" />
        </Button>
        <Button
          disabled={soldOut}
          className="h-[46px] flex-1 flex-col gap-0 rounded-btn bg-cta leading-[1.15] text-white hover:bg-cta-hover"
        >
          <span className="text-title font-semibold">{soldOut ? "Tạm hết hàng" : "Mua ngay"}</span>
          {!soldOut && <span className="text-[12px] font-normal">{formatVnd(total)}</span>}
        </Button>
      </div>
    </>
  );
}
