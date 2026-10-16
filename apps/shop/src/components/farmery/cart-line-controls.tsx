"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, setCartQuantity } from "@/lib/data/cart-actions";
import { formatQty } from "@/lib/format";

interface Props {
  listingId: string;
  productName: string;
  quantity: number;
  available: number;
  saleUnit: string;
}

/** Đổi số lượng (nút −/+ hoặc gõ số), xoá một dòng giỏ; báo lỗi vượt tồn ngay dưới dòng. */
export function CartLineControls({ listingId, productName, quantity, available, saleUnit }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(String(quantity));
  const [synced, setSynced] = useState(quantity);
  if (synced !== quantity) {
    setSynced(quantity);
    setDraft(String(quantity));
  }

  function run(action: () => Promise<{ ok: boolean; code?: string; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) return;
      setDraft(String(quantity));
      setError(
        r.code === "CART_QTY_EXCEEDS_STOCK"
          ? `Chỉ còn ${formatQty(available)} ${saleUnit}, không đặt thêm được.`
          : (r.message ?? "Có lỗi xảy ra."),
      );
    });
  }

  function commit(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      setDraft(String(quantity));
      setError("Số lượng phải lớn hơn 0. Muốn bỏ sản phẩm thì bấm Xoá.");
      return;
    }
    if (value === quantity) return;
    setDraft(String(value));
    run(() => setCartQuantity(listingId, value));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-btn border border-border" aria-busy={pending}>
          <button
            type="button"
            aria-label={`Giảm số lượng ${productName}`}
            disabled={pending || quantity <= 1}
            onClick={() => commit(quantity - 1)}
            className="grid size-11 place-items-center text-ink-2 disabled:opacity-40 md:size-10"
          >
            <Minus className="size-4" />
          </button>
          <input
            aria-label={`Số lượng ${productName}`}
            inputMode="decimal"
            value={draft}
            disabled={pending}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit(Number(draft.replace(",", ".")))}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-11 w-12 bg-transparent text-center text-body font-semibold text-ink outline-none disabled:opacity-60 md:h-10"
          />
          <button
            type="button"
            aria-label={`Tăng số lượng ${productName}`}
            disabled={pending || quantity >= available}
            onClick={() => commit(quantity + 1)}
            className="grid size-11 place-items-center text-ink-2 disabled:opacity-40 md:size-10"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => removeCartItem(listingId))}
          className="flex min-h-11 items-center gap-1.5 px-2 text-small text-muted-foreground hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden /> Xoá
        </button>
      </div>
      <p role="status" className="text-micro font-medium text-danger">
        {error}
      </p>
    </div>
  );
}
