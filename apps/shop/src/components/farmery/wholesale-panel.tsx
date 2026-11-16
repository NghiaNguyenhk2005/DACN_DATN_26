"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Clock, Info, Package } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import { sendQuoteRequest } from "@/lib/data/wholesale-actions";
import { todayVn, wholesaleTier } from "@/lib/decision";
import { formatQty, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

const field = "w-full rounded-btn border border-border bg-background px-3 py-2.5 text-title text-ink outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Chế độ Mua sỉ của khung mua (3P, FR6.1, FR6.4): bậc giá của nhà cung cấp, lượng tối thiểu, thời gian chuẩn bị,
 * ước tính theo sản lượng và form gửi yêu cầu báo giá. Phản hồi, thương lượng, hợp đồng thuộc MVP.
 */
export function WholesalePanel({
  offer,
  productId,
  supplierName,
}: {
  offer: Schema<"WholesaleOffer">;
  productId: string;
  supplierName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [qty, setQty] = useState(String(offer.minQuantity));
  const [neededBy, setNeededBy] = useState(() => addDays(todayVn(), offer.leadTimeDays + 1));
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const quantity = Number(qty.replace(",", "."));
  const tier = Number.isFinite(quantity) ? wholesaleTier(offer, quantity) : null;
  const belowMin = !(quantity >= offer.minQuantity);
  const tiers = [...offer.tiers].sort((a, b) => a.minQuantity - b.minQuantity);

  const submit = () =>
    startTransition(async () => {
      setResult(null);
      const res = await sendQuoteRequest({ productId, quantity, neededBy, note });
      if (res.ok) {
        setResult({ ok: true, text: `Đã gửi tới ${supplierName}. Nhà cung cấp sẽ phản hồi báo giá cho bạn.` });
        setNote("");
      } else if (res.code === "UNAUTHENTICATED") {
        router.push(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
      } else {
        setResult({ ok: false, text: res.message });
      }
    });

  return (
    <div className="flex flex-col gap-3.5">
      <table className="w-full text-small">
        <caption className="mb-1.5 text-left text-caption text-muted-foreground">Bảng giá sỉ của nhà cung cấp</caption>
        <tbody>
          {tiers.map((t) => {
            const active = tier?.minQuantity === t.minQuantity;
            return (
              <tr key={t.minQuantity} className={cn("border-b border-line last:border-0", active && "font-semibold text-primary")}>
                <td className="py-2">
                  Từ {formatQty(t.minQuantity)} {offer.saleUnit}
                </td>
                <td className="py-2 text-right">
                  {formatVnd(t.unitPrice)}/{offer.saleUnit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul className="flex flex-col gap-1.5 text-caption text-ink-2">
        <li className="flex items-center gap-2">
          <Package className="size-4 flex-none text-primary" aria-hidden />
          Lượng tối thiểu {formatQty(offer.minQuantity)} {offer.saleUnit}
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-4 flex-none text-primary" aria-hidden />
          Chuẩn bị hàng trong {offer.leadTimeDays} ngày
        </li>
      </ul>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1 text-caption font-medium text-ink-2">
          Sản lượng ({offer.saleUnit})
          <input
            type="number"
            inputMode="decimal"
            min={offer.minQuantity}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={field}
            aria-invalid={belowMin}
          />
        </label>
        <label className="flex flex-col gap-1 text-caption font-medium text-ink-2">
          Ngày cần hàng
          <input type="date" min={todayVn()} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-caption font-medium text-ink-2">
        Ghi chú cho nhà cung cấp
        <textarea
          rows={2}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quy cách đóng gói, nơi giao, cần hóa đơn VAT…"
          className={field}
        />
      </label>

      {belowMin ? (
        <p className="flex gap-2 rounded-tile border border-warning-line bg-warning-soft px-3 py-2 text-caption text-warning">
          <Info className="mt-px size-4 flex-none" aria-hidden />
          Chưa đạt lượng tối thiểu {formatQty(offer.minQuantity)} {offer.saleUnit}. Mua ít hơn thì chọn Mua lẻ.
        </p>
      ) : (
        tier && (
          <div className="flex items-baseline justify-between text-small text-ink-2">
            <span>Ước tính</span>
            <span className="text-[17px] font-bold text-ink">{formatVnd(Math.round(tier.unitPrice * quantity))}</span>
          </div>
        )
      )}

      <Button
        disabled={pending || belowMin || !neededBy}
        onClick={submit}
        className="h-auto rounded-btn bg-cta py-3 text-title font-semibold text-white hover:bg-cta-hover"
      >
        {pending ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
      </Button>
      <p className="text-micro text-muted-foreground">Giá cuối cùng do nhà cung cấp báo lại; Farmery chưa trừ tiền ở bước này.</p>
      {result && (
        <p role="status" className={cn("flex gap-2 text-small", result.ok ? "text-success" : "text-danger")}>
          {result.ok && <CheckCircle2 className="mt-0.5 size-4 flex-none" aria-hidden />}
          {result.text}
        </p>
      )}
    </div>
  );
}
