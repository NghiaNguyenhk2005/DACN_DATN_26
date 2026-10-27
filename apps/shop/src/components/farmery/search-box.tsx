"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompactHeader } from "./header-actions";

/** Ô tìm kiếm của đầu trang: form GET tới /tim-kiem, giữ lại từ khoá đang tìm. */
export function SearchBox() {
  const q = useSearchParams().get("q") ?? "";
  const compact = useCompactHeader();
  return (
    <form
      action="/tim-kiem"
      role="search"
      className={cn(
        "order-last flex h-11 w-full items-center gap-2.5 rounded-search border border-border bg-surface px-3.5 md:order-none md:h-auto md:max-w-[520px] md:flex-1 md:py-2.5",
        compact && "max-md:hidden",
      )}
    >
      <Search className="size-4 flex-none text-[#7a8a72]" aria-hidden />
      <input
        key={q}
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Tìm rau, trái cây, đặc sản Đà Lạt..."
        aria-label="Tìm kiếm sản phẩm"
        className="w-full min-w-0 bg-transparent text-title text-ink outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}
