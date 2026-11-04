"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeCartItem, setCartQuantity } from "@/lib/data/cart-actions";
import { formatQty } from "@/lib/format";
import { QuantityInput } from "./quantity-input";

interface Props {
  listingId: string;
  productName: string;
  quantity: number;
  available: number;
  saleUnit: string;
}

/** Đổi số lượng (nút −/+ hoặc gõ số, quy tắc theo đơn vị bán), xóa một dòng giỏ; báo lỗi vượt tồn ngay dưới dòng. */
export function CartLineControls({ listingId, productName, quantity, available, saleUnit }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; code?: string; message?: string }>) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) return;
      setMessage(
        r.code === "CART_QTY_EXCEEDS_STOCK"
          ? `Chỉ còn ${formatQty(available)} ${saleUnit}, không đặt thêm được.`
          : (r.message ?? "Có lỗi xảy ra."),
      );
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2" aria-busy={pending}>
        <QuantityInput
          value={quantity}
          saleUnit={saleUnit}
          max={available}
          label={`số lượng ${productName}`}
          disabled={pending}
          className="md:[&_button]:size-10 md:[&_input]:h-10"
          onChange={(qty, note) => {
            setMessage(note);
            if (qty !== quantity) run(() => setCartQuantity(listingId, qty));
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => removeCartItem(listingId))}
          className="flex min-h-11 items-center gap-1.5 px-2 text-small text-muted-foreground hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden /> Xóa
        </button>
      </div>
      <p role="status" className="text-micro font-medium text-danger">
        {message}
      </p>
    </div>
  );
}
