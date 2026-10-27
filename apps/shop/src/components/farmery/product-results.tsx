"use client";

import { useState, useTransition } from "react";
import type { Schema } from "@farmery/contract";
import { loadMoreProducts } from "@/lib/data/actions";
import type { ProductQuery } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { ProductCard } from "./product-card";

interface Props {
  initial: { items: Schema<"ProductCard">[]; nextCursor: string | null };
  /** Truy vấn đã dùng cho trang đầu; "Xem thêm" gửi lại kèm nextCursor. */
  query: ProductQuery;
  /** Có cột bộ lọc bên cạnh thì lưới hẹp hơn. */
  withSidebar?: boolean;
  empty?: React.ComponentProps<typeof EmptyState>;
}

/** Lưới sản phẩm 2 cột (mobile, gap 12) → 4–5 cột (xl, gap 16) và nút "Xem thêm" theo cursor. */
export function ProductResults({ initial, query, withSidebar, empty }: Props) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return <EmptyState {...empty} />;

  const loadMore = () => {
    if (!cursor) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const page = await loadMoreProducts(query, cursor);
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4",
          withSidebar ? "xl:grid-cols-4" : "lg:grid-cols-4 xl:grid-cols-5",
        )}
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {cursor && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="h-11 min-w-[180px] rounded-btn border-[1.5px] border-chip px-5 text-title font-semibold text-primary hover:bg-surface disabled:opacity-60"
          >
            {pending ? "Đang tải…" : "Xem thêm"}
          </button>
          {failed && (
            <p role="alert" className="text-caption text-danger">
              Không tải thêm được. Vui lòng thử lại.
            </p>
          )}
        </div>
      )}
    </>
  );
}
