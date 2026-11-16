"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Folder, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { api } from "@/lib/api";
import { appliedFilters, filtersFromInterpretation, filtersToSearch } from "@/lib/filters";
import { formatVnd } from "@/lib/format";
import { categoryHref, productHref } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { useCompactHeader } from "./header-actions";
import { SafeImage } from "./safe-image";

const RECENT_KEY = "farmery:tim-gan-day";
const MAX_RECENT = 5;

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // Trình duyệt chặn lưu trữ: bỏ qua, chỉ mất tiện ích "tìm gần đây".
  }
}

type Item = { key: string; href: string; label: React.ReactNode; icon: React.ReactNode; group: string };

/**
 * Ô tìm kiếm của đầu trang (combobox, mẫu ARIA APG): gõ → sau 200 ms gợi ý sản phẩm, danh mục, vùng trồng, bộ lọc
 * hiểu từ câu; ô trống → tìm gần đây. ↑↓ chọn, Enter mở, Esc đóng. Không có JS vẫn là form GET tới /tim-kiem.
 */
export function SearchBox() {
  const q = useSearchParams().get("q") ?? "";
  const compact = useCompactHeader();
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(q);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggest, setSuggest] = useState<Schema<"SearchSuggest"> | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLFormElement>(null);

  // Đổi trang tìm kiếm (q trên URL đổi) thì ô nhập theo q mới.
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setValue(q);
  }

  useEffect(() => {
    const term = value.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await api.GET("/search/suggest", { params: { query: { q: term } }, signal: ctrl.signal });
        if (res.data) setSuggest(res.data);
      } catch {
        // Gợi ý là phần phụ: lỗi mạng thì chỉ còn dòng "Tìm tất cả".
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const term = value.trim();
  const data = term ? suggest : null;
  const items: Item[] = [];
  if (!term) {
    recent.forEach((r) =>
      items.push({ key: `r-${r}`, group: "Tìm gần đây", href: `/tim-kiem?q=${encodeURIComponent(r)}`, label: r, icon: <Clock className="size-4" /> }),
    );
  } else {
    const interp = data?.interpretation;
    if (interp && interp.phrases.length > 0) {
      const f = filtersFromInterpretation(interp);
      items.push({
        key: "hieu",
        group: "Lọc theo câu tìm",
        href: `/tim-kiem${filtersToSearch(interp.keywords || undefined, f)}`,
        label: (
          <>
            {interp.keywords && <strong className="font-semibold">{interp.keywords}</strong>}{" "}
            <span className="text-muted-foreground">· {appliedFilters(f).map((a) => a.label).join(" · ")}</span>
          </>
        ),
        icon: <SlidersHorizontal className="size-4" />,
      });
    }
    data?.products.forEach((p) =>
      items.push({
        key: `p-${p.id}`,
        group: "Sản phẩm",
        href: productHref(p),
        label: (
          <span className="flex w-full items-baseline justify-between gap-3">
            <span className="truncate">{p.name}</span>
            {p.unitPrice !== null && (
              <span className="flex-none text-caption text-muted-foreground">
                {formatVnd(p.unitPrice)}/{p.saleUnit}
              </span>
            )}
          </span>
        ),
        icon: (
          <span className="relative block size-8 overflow-hidden rounded-[6px] bg-surface">
            <SafeImage src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />
          </span>
        ),
      }),
    );
    data?.categories.forEach((c) =>
      items.push({ key: `c-${c.id}`, group: "Danh mục", href: categoryHref(c), label: c.name, icon: <Folder className="size-4" /> }),
    );
    data?.regions.forEach((r) =>
      items.push({
        key: `v-${r}`,
        group: "Vùng trồng",
        href: `/tim-kiem${filtersToSearch(undefined, { region: r })}`,
        label: r,
        icon: <MapPin className="size-4" />,
      }),
    );
    items.push({
      key: "all",
      group: "",
      href: `/tim-kiem?q=${encodeURIComponent(term)}`,
      label: (
        <>
          Tìm tất cả “<strong className="font-semibold">{term}</strong>”
        </>
      ),
      icon: <Search className="size-4" />,
    });
  }

  const remember = (text: string) => {
    if (!text) return;
    const next = [text, ...readRecent().filter((r) => r !== text)];
    saveRecent(next);
    setRecent(next.slice(0, MAX_RECENT));
  };

  const go = (item: Item) => {
    if (term) remember(term);
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (items.length === 0) return;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter" && open && active >= 0 && items[active]) {
      e.preventDefault();
      go(items[active]);
    }
  };

  const showList = open && items.length > 0;
  const optionId = (i: number) => `${listId}-o${i}`;

  return (
    <form
      ref={boxRef}
      action="/tim-kiem"
      role="search"
      onSubmit={() => remember(term)}
      className={cn(
        "relative order-last flex h-11 w-full items-center gap-2.5 rounded-search border border-border bg-surface px-3.5 md:order-none md:h-auto md:max-w-[520px] md:flex-1 md:py-2.5",
        compact && "max-md:hidden",
      )}
    >
      <Search className="size-4 flex-none text-[#7a8a72]" aria-hidden />
      <input
        name="q"
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setRecent(readRecent());
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Tìm rau, trái cây, đặc sản Đà Lạt..."
        aria-label="Tìm kiếm sản phẩm"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        className="w-full min-w-0 bg-transparent text-title text-ink outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Xóa nội dung tìm"
          onClick={() => {
            setValue("");
            setActive(-1);
          }}
          className="grid size-7 flex-none place-items-center rounded-full text-subtle hover:bg-surface-2"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Gợi ý tìm kiếm"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-card border border-border bg-popover p-1.5 shadow-lg"
        >
          {items.map((item, i) => {
            const groupStart = item.group && item.group !== items[i - 1]?.group;
            return (
              <li key={item.key} role="presentation">
                {groupStart && (
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-2 text-micro font-semibold uppercase tracking-wide text-subtle">
                    {item.group}
                    {item.group === "Tìm gần đây" && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          saveRecent([]);
                          setRecent([]);
                        }}
                        className="normal-case tracking-normal text-primary"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}
                <div
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-btn px-2.5 py-1.5 text-title text-ink-2",
                    i === active && "bg-surface text-ink",
                  )}
                >
                  <span className="grid flex-none place-items-center text-primary">{item.icon}</span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
