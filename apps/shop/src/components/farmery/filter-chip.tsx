import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  /** Chip lọc nhanh: đang chọn */
  active?: boolean;
  /** Có href → chip là liên kết (lọc nhanh ở trang chủ) */
  href?: string;
  onClick?: () => void;
  /** Có onRemove → chip "đã áp dụng" với dấu ✕ (luôn ở trạng thái active) */
  onRemove?: () => void;
  className?: string;
}

/** Pill: nền #f4f7f1, viền #d8e0d3, chữ #1f5132 đậm 600 khi active; chưa chọn: viền #e6ebe2, chữ #3d4a37. */
export function FilterChip({ label, active, href, onClick, onRemove, className }: Props) {
  const on = active || !!onRemove;
  const base = cn(
    "inline-flex min-h-10 flex-none items-center gap-[7px] whitespace-nowrap rounded-full border px-3.5 py-2 text-small md:min-h-0 md:px-3 md:py-[7px] md:text-caption",
    on ? "border-chip bg-surface font-semibold text-primary" : "border-border bg-transparent text-ink-2 hover:bg-surface",
    className,
  );
  if (onRemove) {
    return (
      <span className={base}>
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Bỏ lọc ${label}`}
          className="-my-2 -mr-2.5 grid size-8 place-items-center text-muted-foreground md:size-6"
        >
          <X className="size-3" />
        </button>
      </span>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cn(base, "hover:text-ink-2")}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={base}>
      {label}
    </button>
  );
}
