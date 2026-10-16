"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavCategory {
  label: string;
  href: string;
}

/** Desktop: hàng liên kết gap-[30px]. Mobile: cuộn ngang, thêm mục "Tất cả", gạch chân mục đang chọn. */
export function CategoryNav({ items }: { items: NavCategory[] }) {
  const pathname = usePathname();
  const all = [{ label: "Tất cả", href: "/" }, ...items];
  return (
    <nav aria-label="Danh mục" className="border-b border-line">
      <div className="mx-auto max-w-[1440px] px-4 md:px-12">
        <ul className="scrollbar-none flex gap-[22px] overflow-x-auto whitespace-nowrap md:gap-[30px]">
          {all.map((c, i) => {
            const active = c.href === pathname;
            return (
              <li key={c.href} className={cn(i === 0 && "md:hidden")}>
                <Link
                  href={c.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block border-b-2 border-transparent py-3 text-title font-medium text-ink-2 hover:text-primary-hover md:border-0 md:py-[13px]",
                    active && "border-primary font-semibold text-primary md:text-primary",
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
