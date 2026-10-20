import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { EmptyState } from "@/components/farmery/empty-state";
import { isNotImplemented, NotReadyState } from "@/components/farmery/not-ready-state";
import { getMyOrders, requireViewer, type OrderPage } from "@/lib/data/account";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Đơn hàng của tôi" };

const TONE: Partial<Record<Schema<"OrderStatus">, string>> = {
  placed: "bg-warning-soft text-warning",
  completed: "bg-surface-2 text-ink-2",
  delivered: "bg-surface-2 text-ink-2",
  cancelled: "bg-danger-soft text-danger",
  returned: "bg-danger-soft text-danger",
  disputed: "bg-warning-soft text-warning",
};

export default async function MyOrdersPage({ searchParams }: PageProps<"/don-hang">) {
  const { sau } = await searchParams;
  const cursor = typeof sau === "string" ? sau : undefined;
  let page: OrderPage;
  try {
    await requireViewer(cursor ? `/don-hang?sau=${encodeURIComponent(cursor)}` : "/don-hang");
    page = await getMyOrders(cursor);
  } catch (e) {
    if (isNotImplemented(e)) return <NotReadyState />;
    throw e;
  }

  return (
    <div className="pb-10">
      <h1 className="py-4 font-serif text-h1-sm font-bold text-ink md:py-6 md:text-h1">Đơn hàng của tôi</h1>
      {page.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={cursor ? "Không còn đơn cũ hơn" : "Bạn chưa có đơn hàng nào"}
          description="Đơn đã đặt sẽ hiện ở đây cùng hành trình giao hàng."
          action={{ label: cursor ? "Về đơn mới nhất" : "Bắt đầu mua sắm", href: cursor ? "/don-hang" : "/" }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {page.items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/don-hang/${o.id}`}
                className="flex items-center gap-3 rounded-panel border border-border p-4 transition-colors hover:border-primary/40 md:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-title font-bold text-ink">{o.orderCode}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-micro font-semibold",
                        TONE[o.status] ?? "bg-leaf-soft text-primary",
                      )}
                    >
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    Đặt ngày {formatDateTimeVi(o.placedAt)} · {o.itemCount} sản phẩm
                  </p>
                </div>
                <span className="flex-none text-title font-bold text-ink">{formatVnd(o.totalAmount)}</span>
                <ChevronRight className="size-5 flex-none text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {page.nextCursor && (
        <Link
          href={`/don-hang?sau=${encodeURIComponent(page.nextCursor)}`}
          className="mx-auto mt-5 grid h-11 w-fit place-items-center rounded-btn border-[1.5px] border-primary px-5 text-title font-semibold text-primary"
        >
          Xem đơn cũ hơn
        </Link>
      )}
    </div>
  );
}
