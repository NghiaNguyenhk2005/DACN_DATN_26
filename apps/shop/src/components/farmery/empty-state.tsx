import Link from "next/link";
import { SearchX, type LucideIcon } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: { label: string; href: string };
  icon?: LucideIcon;
}

/** Khối "không có kết quả" cho danh sách sản phẩm, giỏ hàng trống. */
export function EmptyState({
  title = "Chưa có sản phẩm phù hợp",
  description = "Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác.",
  action,
  icon: Icon = SearchX,
}: Props) {
  return (
    <section className="flex flex-col items-center rounded-panel border border-dashed border-line-strong px-5 py-10 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-surface text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mb-1 text-h3 font-bold text-ink">{title}</h2>
      <p className="mb-4 max-w-[360px] text-small text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="grid h-11 place-items-center rounded-btn border-[1.5px] border-primary px-5 text-title font-semibold text-primary"
        >
          {action.label}
        </Link>
      )}
    </section>
  );
}
