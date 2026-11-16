"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { normalizeQty, parseQtyInput, quantityRule } from "@/lib/decision";
import { formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  /** Gọi với số đã hợp lệ (làm tròn, kẹp trong tồn) và câu giải thích nếu phải sửa số người dùng gõ */
  onChange: (qty: number, note: string | null) => void;
  saleUnit: string;
  max: number;
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Ô số lượng dùng chung (khung mua, giỏ hàng): gõ tự do + nút −/+. Quy tắc theo đơn vị bán (`quantityRule`):
 * "kg" nhập lẻ tới 0,1, bước 0,5; đơn vị đóng gói chỉ số nguyên. Gõ xong (rời ô hoặc Enter) mới chuẩn hóa.
 */
export function QuantityInput({ value, onChange, saleUnit, max, label, disabled, className }: Props) {
  const rule = quantityRule(saleUnit);
  const [draft, setDraft] = useState(formatQty(value));
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(formatQty(value));
  }

  const commit = (raw: number) => {
    const { qty, note } = normalizeQty(raw, rule, max, saleUnit);
    setDraft(formatQty(qty));
    onChange(qty, note);
  };
  const stepTo = (dir: 1 | -1) => {
    // Bấm −/+ thì về bội số của bước (1,3 → 1,5 hoặc 1,0) cho dễ đọc.
    const next = dir > 0 ? Math.floor(value / rule.step + 1e-9) * rule.step + rule.step : Math.ceil(value / rule.step - 1e-9) * rule.step - rule.step;
    commit(Math.max(rule.byWeight ? rule.step : rule.min, next));
  };

  return (
    <div className={cn("flex items-center rounded-btn border border-border", className)}>
      <button
        type="button"
        aria-label={`Giảm ${label}`}
        disabled={disabled || value <= (rule.byWeight ? rule.step : rule.min)}
        onClick={() => stepTo(-1)}
        className="grid size-11 flex-none place-items-center text-ink-2 disabled:opacity-40 md:size-9"
      >
        <Minus className="size-4" />
      </button>
      <input
        aria-label={label}
        inputMode={rule.byWeight ? "decimal" : "numeric"}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => commit(parseQtyInput(draft))}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-11 w-12 min-w-0 bg-transparent text-center text-body font-semibold text-ink outline-none disabled:opacity-60 md:h-9 md:w-[46px]"
      />
      <button
        type="button"
        aria-label={`Tăng ${label}`}
        disabled={disabled || value + 1e-9 >= max}
        onClick={() => stepTo(1)}
        className="grid size-11 flex-none place-items-center text-ink-2 disabled:opacity-40 md:size-9"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
