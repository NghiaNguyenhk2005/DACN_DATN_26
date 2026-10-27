import { Check, TriangleAlert } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { formatTimeVi } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STEPS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const BRANCH_STATUSES: readonly Schema<"OrderStatus">[] = ["disputed", "cancelled", "returned"];

/** Tám bước của đơn: bước đã qua có giờ theo `timeline`; khiếu nại, huỷ, hoàn hàng hiện thành dải cảnh báo phía trên. */
export function OrderTimeline({ order }: { order: Schema<"OrderDetail"> }) {
  const reachedAt = new Map(order.timeline.map((e) => [e.toStatus, e]));
  const lastReached = ORDER_STEPS.reduce((last, step, i) => (reachedAt.has(step) ? i : last), -1);
  const branch = BRANCH_STATUSES.includes(order.status) ? order.timeline.findLast((e) => e.toStatus === order.status) : null;

  return (
    <section aria-labelledby="timeline-title" className="rounded-panel border border-border p-5 md:p-6">
      <h2 id="timeline-title" className="mb-3 text-h3 font-bold text-ink">
        Hành trình đơn hàng
      </h2>
      {branch && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-card bg-warning-soft px-3 py-2.5 text-small text-ink">
          <TriangleAlert className="mt-0.5 size-4 flex-none text-warning" aria-hidden />
          <span>
            <strong>{ORDER_STATUS_LABELS[order.status]}</strong> · {formatTimeVi(branch.occurredAt)}
            {branch.note && <> — {branch.note}</>}
          </span>
        </p>
      )}
      <ol className="flex flex-col">
        {ORDER_STEPS.map((step, i) => {
          const event = reachedAt.get(step);
          const done = i <= lastReached;
          const current = i === lastReached && order.status === step && step !== "completed";
          return (
            <li key={step} className="grid grid-cols-[22px_1fr] gap-x-3" aria-current={current ? "step" : undefined}>
              <div aria-hidden className="flex flex-col items-center">
                <div className={cn("h-2 w-[1.5px]", i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-line-strong")} />
                <span
                  className={cn(
                    "grid size-[22px] flex-none place-items-center rounded-full border-[1.5px]",
                    done ? "border-primary bg-primary text-white" : "border-line-strong bg-background",
                    current && "ring-4 ring-primary/15",
                  )}
                >
                  {done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <div
                  className={cn(
                    "w-[1.5px] flex-1",
                    i === ORDER_STEPS.length - 1 ? "opacity-0" : i < lastReached ? "bg-primary" : "bg-line-strong",
                  )}
                />
              </div>
              <div className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-3 pb-3 pt-1.5">
                <span className={cn("text-small", done ? "font-semibold text-ink" : "text-subtle")}>
                  {ORDER_STATUS_LABELS[step]}
                  {current && <span className="ml-2 text-caption font-medium text-primary">Hiện tại</span>}
                </span>
                {event && <time className="text-caption text-muted-foreground">{formatTimeVi(event.occurredAt)}</time>}
                {event?.note && <p className="w-full text-caption text-ink-2">{event.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
