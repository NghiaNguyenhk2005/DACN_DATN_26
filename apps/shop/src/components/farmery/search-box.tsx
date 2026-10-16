"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Ô tìm kiếm của đầu trang: form GET tới /tim-kiem, giữ lại từ khoá đang tìm. */
export function SearchBox() {
  const q = useSearchParams().get("q") ?? "";
  return (
    <form
      action="/tim-kiem"
      role="search"
      className="order-last flex h-11 w-full items-center gap-2.5 rounded-search border border-border bg-surface px-3.5 md:order-none md:h-auto md:max-w-[520px] md:flex-1 md:py-2.5"
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
