import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleX, PackageCheck, TimerOff } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { CheckoutSteps } from "@/components/farmery/checkout-steps";
import { isNotImplemented, NotReadyState } from "@/components/farmery/not-ready-state";
import { PaymentPanel } from "@/components/farmery/payment-panel";
import { getOrder, requireViewer } from "@/lib/data/account";
import { formatDayVi, formatQty, formatSlot, formatVnd } from "@/lib/format";
import { traceHref } from "@/lib/slug";

export const metadata: Metadata = { title: "Đơn hàng" };

export default async function OrderPage({ params }: PageProps<"/don-hang/[ma]">) {
  const { ma } = await params;
  let found: Awaited<ReturnType<typeof getOrder>>;
  try {
    await requireViewer(`/don-hang/${ma}`);
    found = /^\d+$/.test(ma) ? await getOrder(ma) : null;
  } catch (e) {
    if (isNotImplemented(e)) return <NotReadyState />;
    throw e;
  }
  if (!found) notFound();
  const { order, apiNow } = found;

  const awaitingPayment = order.status === "placed" && order.paymentOption === "prepaid" && !!order.reserveExpiresAt;

  return (
    <div className="pb-10">
      <CheckoutSteps current={2} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          {awaitingPayment ? (
            <PaymentPanel
              orderId={order.id}
              totalAmount={order.totalAmount}
              placedAt={order.placedAt}
              reserveExpiresAt={order.reserveExpiresAt!}
              cancellable={order.cancellable ?? false}
              serverNow={apiNow}
            />
          ) : (
            <StatusPanel order={order} />
          )}
        </div>
        <OrderSummaryCard order={order} />
      </div>
    </div>
  );
}

function StatusPanel({ order }: { order: Schema<"OrderDetail"> }) {
  if (order.status === "cancelled") {
    const cancelled = order.timeline.findLast((e) => e.toStatus === "cancelled");
    // Đơn trả trước chưa từng thanh toán, huỷ từ lúc hết hạn giữ chỗ trở đi: báo rõ là hết giờ.
    const expired =
      order.paymentOption === "prepaid" &&
      !order.timeline.some((e) => e.toStatus === "paid") &&
      !!order.reserveExpiresAt &&
      !!cancelled &&
      Date.parse(cancelled.occurredAt) >= Date.parse(order.reserveExpiresAt);
    return (
      <section role="alert" className="rounded-panel border border-danger-line bg-danger-soft p-5 text-center md:p-7">
        {expired ? <TimerOff className="mx-auto mb-2 size-9 text-danger" aria-hidden /> : <CircleX className="mx-auto mb-2 size-9 text-danger" aria-hidden />}
        <h1 className="mb-1 text-h2-sm font-bold text-danger-ink md:text-h2">{expired ? "Đã hết thời gian giữ chỗ" : "Đơn đã huỷ"}</h1>
        <p className="mb-4 text-small text-danger-ink">
          {expired
            ? "Đơn chưa được thanh toán kịp nên đã tự huỷ, hàng được trả lại kho. Vui lòng đặt lại."
            : (cancelled?.note ?? "Đơn không còn hiệu lực, hàng đã được trả lại kho.")}
        </p>
        <Link href="/" className="inline-grid h-11 place-items-center rounded-btn bg-primary px-5 text-title font-semibold text-white hover:bg-primary-hover">
          Tiếp tục mua sắm
        </Link>
      </section>
    );
  }

  const paid = order.status === "paid";
  return (
    <section className="rounded-panel border border-border p-5 text-center md:p-7">
      {paid ? (
        <CircleCheck className="mx-auto mb-2 size-10 text-success" aria-hidden />
      ) : (
        <PackageCheck className="mx-auto mb-2 size-10 text-primary" aria-hidden />
      )}
      <h1 className="mb-1 font-serif text-h1-sm font-bold text-ink">{paid ? "Đặt hàng thành công" : "Đơn đang được xử lý"}</h1>
      <p className="mb-1 text-small text-ink-2">
        Mã đơn <strong className="text-ink">{order.orderCode}</strong>
      </p>
      <p className="mx-auto mb-5 max-w-[420px] text-small text-muted-foreground">
        {order.paymentOption === "cod"
          ? `Bạn trả ${formatVnd(order.totalAmount)} tiền mặt khi nhận hàng. `
          : paid
            ? `Đã thanh toán ${formatVnd(order.totalAmount)}. `
            : ""}
        Hàng giao {formatDayVi(order.deliveryDate).toLowerCase()}, khung {formatSlot(order.deliverySlot)}.
      </p>
      <Link href="/" className="inline-grid h-11 place-items-center rounded-btn border-[1.5px] border-primary px-5 text-title font-semibold text-primary">
        Tiếp tục mua sắm
      </Link>
    </section>
  );
}

function OrderSummaryCard({ order }: { order: Schema<"OrderDetail"> }) {
  const a = order.address;
  return (
    <aside aria-label="Thông tin đơn hàng" className="rounded-panel border border-border p-5">
      <h2 className="mb-0.5 text-h3 font-bold text-ink">Đơn {order.orderCode}</h2>
      <p className="mb-4 text-caption text-muted-foreground">
        {order.paymentOption === "cod" ? "Tiền mặt khi nhận hàng (COD)" : "Thanh toán trước"}
      </p>

      <dl className="mb-4 grid gap-3 text-small">
        <div>
          <dt className="text-caption text-muted-foreground">Giao đến</dt>
          <dd className="text-ink-2">
            <span className="font-semibold text-ink">{a.recipientName}</span> · {a.phone}
            <br />
            {a.addressLine}, {a.ward}, {a.province}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">Khung giờ giao</dt>
          <dd className="text-ink-2 first-letter:uppercase">
            {formatDayVi(order.deliveryDate)} · {formatSlot(order.deliverySlot)}
          </dd>
        </div>
      </dl>

      <ul className="mb-4 flex flex-col gap-2.5 border-t border-line pt-4 text-small">
        {order.items.map((i) => (
          <li key={`${i.batchCode}-${i.productName}`} className="flex justify-between gap-3">
            <span className="min-w-0 text-ink-2">
              {i.productName}{" "}
              <span className="text-muted-foreground">
                × {formatQty(i.quantity)} {i.saleUnit}
              </span>
              <Link href={traceHref(i.traceCode)} className="flex min-h-11 items-center text-caption text-primary hover:text-primary-hover">
                Lô {i.batchCode} · Xem nguồn gốc
              </Link>
            </span>
            <span className="flex-none font-semibold text-ink">{formatVnd(i.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1.5 border-t border-line pt-4 text-small text-ink-2">
        <div className="flex justify-between gap-3">
          <dt>Tiền hàng</dt>
          <dd className="text-ink">{formatVnd(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Phí giao</dt>
          <dd className={order.shippingFee === 0 ? "text-success" : "text-ink"}>
            {order.shippingFee === 0 ? "Miễn phí" : formatVnd(order.shippingFee)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 text-caption text-muted-foreground">
          <dt>Thuế GTGT (đã gồm trong giá)</dt>
          <dd>{formatVnd(order.taxAmount)}</dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <dt className="text-title text-ink">Tổng cộng</dt>
          <dd className="text-[20px] font-bold text-cta">{formatVnd(order.totalAmount)}</dd>
        </div>
      </dl>
    </aside>
  );
}
