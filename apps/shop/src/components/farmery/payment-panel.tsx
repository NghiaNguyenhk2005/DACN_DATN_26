"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrder, payOrder } from "@/lib/data/order-actions";
import { formatVnd } from "@/lib/format";

interface Props {
  orderId: string;
  totalAmount: number;
  placedAt: string;
  reserveExpiresAt: string;
  cancellable: boolean;
  /** Giờ của API lúc trả đơn, để bù lệch đồng hồ của máy người xem. */
  serverNow: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Trả tiền giả lập cho đơn trả trước, đếm ngược tới `reserveExpiresAt`; hết giờ thì khoá nút và báo hết hạn. */
export function PaymentPanel({ orderId, totalAmount, placedAt, reserveExpiresAt, cancellable, serverNow }: Props) {
  const router = useRouter();
  const [offset] = useState(() => serverNow - Date.now());
  const [now, setNow] = useState(serverNow);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const refreshed = useRef(false);

  const expiresAt = Date.parse(reserveExpiresAt);
  const total = Math.max(1, expiresAt - Date.parse(placedAt));
  const remaining = Math.max(0, expiresAt - now);
  const expired = remaining === 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);

  useEffect(() => {
    // Hết giờ: tải lại một lần để lấy trạng thái đơn mới (API tự huỷ đơn quá hạn).
    if (expired && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [expired, router]);

  function run(action: (id: string) => ReturnType<typeof payOrder>) {
    setError(null);
    startTransition(async () => {
      const r = await action(orderId);
      if (!r.ok) setError(r.message);
    });
  }

  if (expired) {
    return (
      <section role="alert" className="rounded-panel border border-danger-line bg-danger-soft p-5 text-center md:p-7">
        <TimerOff className="mx-auto mb-2 size-9 text-danger" aria-hidden />
        <h2 className="mb-1 text-h2-sm font-bold text-danger-ink">Đã hết thời gian giữ chỗ</h2>
        <p className="text-small text-danger-ink">Đơn chưa được thanh toán kịp nên đã tự huỷ, hàng được trả lại kho. Vui lòng đặt lại.</p>
      </section>
    );
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const urgent = remaining < 60_000;

  return (
    <section className="rounded-panel border border-border p-5 md:p-7" aria-labelledby="pay-title">
      <h2 id="pay-title" className="mb-1 text-h2-sm font-bold text-ink md:text-h2">
        Thanh toán để giữ đơn
      </h2>
      <p className="mb-4 text-small text-muted-foreground">Hàng trong đơn đang được giữ cho bạn. Quá thời gian dưới đây chưa thanh toán thì đơn tự huỷ.</p>

      <div className="mb-4 flex items-center gap-4 rounded-card bg-surface px-4 py-3.5">
        <Clock className={urgent ? "size-7 text-danger" : "size-7 text-primary"} aria-hidden />
        <div className="flex-1">
          <p className="text-caption text-muted-foreground">Thời gian giữ chỗ còn lại</p>
          <p
            role="timer"
            aria-label={`Còn ${minutes} phút ${seconds} giây`}
            suppressHydrationWarning
            className={`text-[32px] font-bold tabular-nums leading-tight ${urgent ? "text-danger" : "text-ink"}`}
          >
            {pad(minutes)}:{pad(seconds)}
          </p>
        </div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          suppressHydrationWarning
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-danger" : "bg-primary"}`}
          style={{ width: `${(remaining / total) * 100}%` }}
        />
      </div>

      <Button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() => run(payOrder)}
        className="h-12 w-full rounded-btn bg-cta text-title font-semibold text-white hover:bg-cta-hover"
      >
        {pending ? "Đang xử lý…" : `Thanh toán ${formatVnd(totalAmount)}`}
      </Button>
      <p className="mt-2 text-center text-caption text-muted-foreground">Bản demo: thanh toán giả lập, không trừ tiền thật.</p>

      <p role="alert" className="mt-3 text-center text-small text-danger empty:hidden">
        {error}
      </p>

      {cancellable && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-small">
          {confirmCancel ? (
            <>
              <span className="text-ink-2">Huỷ đơn này?</span>
              <button type="button" disabled={pending} onClick={() => run(cancelOrder)} className="min-h-11 px-3 font-semibold text-danger">
                Huỷ đơn
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="min-h-11 px-3 font-semibold text-ink-2">
                Không
              </button>
            </>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirmCancel(true)} className="min-h-11 px-3 text-muted-foreground hover:text-danger">
              Huỷ đơn
            </button>
          )}
        </div>
      )}
    </section>
  );
}
