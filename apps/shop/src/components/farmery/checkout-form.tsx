"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, CreditCard, MapPin, Plus } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import { placeOrder } from "@/lib/data/order-actions";
import { formatDayVi, formatQty, formatSlot, formatVnd } from "@/lib/format";
import type { ActionResult } from "@/lib/problem";
import { cn } from "@/lib/utils";
import { AddressForm } from "./address-form";

interface Props {
  cart: Schema<"Cart">;
  addresses: Schema<"Address">[];
  selectedAddressId: string | null;
  /** null khi chưa có địa chỉ; lỗi 422 của báo giá hiện thành câu báo. */
  quote: ActionResult<Schema<"CheckoutQuote">> | null;
  /** Sinh phía máy chủ một lần mỗi lần mở trang; giữ nguyên qua các lần đổi địa chỉ. */
  idempotencyKey: string;
}

const slotKey = (s: { date: string; slot: string }) => `${s.date}|${s.slot}`;

const optionClass = (selected: boolean, disabled?: boolean) =>
  cn(
    "flex min-h-11 cursor-pointer items-start gap-3 rounded-card border-[1.5px] px-4 py-3 transition-colors",
    selected ? "border-primary bg-surface" : "border-border hover:border-chip",
    disabled && "cursor-not-allowed opacity-60 hover:border-border",
  );

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-border p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-h3 font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Trang thanh toán: địa chỉ → khung giờ → hình thức thanh toán → đặt đơn. Mọi số tiền lấy từ báo giá của API. */
export function CheckoutForm({ cart, addresses, selectedAddressId, quote, idempotencyKey }: Props) {
  const router = useRouter();
  const [key] = useState(idempotencyKey);
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [requoting, startRequote] = useTransition();
  const [placing, startPlacing] = useTransition();
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);
  const [chosenPayment, setChosenPayment] = useState<Schema<"PaymentOption">>("prepaid");
  const [error, setError] = useState<string | null>(null);

  const q = quote?.ok ? quote.data : null;
  const slots = q?.deliverySlots ?? [];
  const firstAvailable = slots.find((s) => s.available);
  const slot = slots.find((s) => s.available && slotKey(s) === chosenSlot) ?? firstAvailable ?? null;
  const payment = chosenPayment === "cod" && !q?.codAllowed ? "prepaid" : chosenPayment;
  const busy = requoting || placing;
  const canPlace = !!q && !!slot && !!selectedAddressId && !busy;

  const days = [...new Set(slots.map((s) => s.date))];

  function selectAddress(id: string) {
    if (id === selectedAddressId) return;
    setError(null);
    startRequote(() => router.replace(`/thanh-toan?dia-chi=${id}`, { scroll: false }));
  }

  function submit() {
    if (!canPlace || !slot || !selectedAddressId) return;
    setError(null);
    startPlacing(async () => {
      const result = await placeOrder({
        addressId: selectedAddressId,
        deliveryDate: slot.date,
        deliverySlot: slot.slot,
        paymentOption: payment,
        idempotencyKey: key,
      });
      if (result && !result.ok) {
        setError(result.message);
        // Báo giá có thể đã đổi (khung giờ qua giờ chốt, COD, tồn kho): tải lại để hiện đúng lựa chọn còn hợp lệ.
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        <Section
          title="Giao đến"
          action={
            addresses.length > 0 &&
            !addingAddress && (
              <button type="button" onClick={() => setAddingAddress(true)} className="flex min-h-11 items-center gap-1 text-small font-semibold text-primary">
                <Plus className="size-4" aria-hidden /> Thêm địa chỉ
              </button>
            )
          }
        >
          {addresses.length > 0 && (
            <div role="radiogroup" aria-label="Địa chỉ giao hàng" className="mb-3 flex flex-col gap-2.5 last:mb-0">
              {addresses.map((a) => (
                <label key={a.id} className={optionClass(a.id === selectedAddressId)}>
                  <input
                    type="radio"
                    name="address"
                    checked={a.id === selectedAddressId}
                    onChange={() => selectAddress(a.id)}
                    disabled={busy}
                    className="mt-1 size-[18px] flex-none accent-primary"
                  />
                  <span className="min-w-0 text-small text-ink-2">
                    <span className="flex flex-wrap items-center gap-x-2 text-title font-semibold text-ink">
                      {a.recipientName} <span className="font-normal text-muted-foreground">· {a.phone}</span>
                      {a.label && <span className="rounded-tag bg-surface-2 px-1.5 py-0.5 text-micro font-medium text-ink-2">{a.label}</span>}
                      {a.isDefault && <span className="rounded-tag bg-success-soft px-1.5 py-0.5 text-micro font-medium text-success">Mặc định</span>}
                    </span>
                    {a.addressLine}, {a.ward}, {a.province}
                  </span>
                </label>
              ))}
            </div>
          )}
          {addingAddress && <AddressForm onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined} />}
        </Section>

        <Section title="Khung giờ giao">
          {!selectedAddressId ? (
            <p className="flex items-center gap-2 text-small text-muted-foreground">
              <MapPin className="size-4" aria-hidden /> Thêm địa chỉ giao hàng để xem khung giờ còn nhận đơn.
            </p>
          ) : quote && !quote.ok ? (
            <p role="alert" className="text-small text-danger">
              {quote.message}
            </p>
          ) : !firstAvailable ? (
            <p className="text-small text-danger">Hiện không còn khung giờ nào nhận đơn. Vui lòng quay lại sau.</p>
          ) : (
            <div className={cn("flex flex-col gap-4", requoting && "opacity-60")}>
              {days.map((day) => (
                <fieldset key={day}>
                  <legend className="mb-2 text-small font-semibold text-ink-2 first-letter:uppercase">{formatDayVi(day)}</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots
                      .filter((s) => s.date === day)
                      .map((s) => {
                        const selected = slot !== null && slotKey(s) === slotKey(slot);
                        return (
                          <label key={slotKey(s)} className={cn(optionClass(selected, !s.available), "flex-col items-center gap-0 px-2 py-2 text-center")}>
                            <input
                              type="radio"
                              name="slot"
                              className="sr-only"
                              checked={selected}
                              disabled={!s.available || busy}
                              onChange={() => setChosenSlot(slotKey(s))}
                            />
                            <span className="text-title font-semibold text-ink">{formatSlot(s.slot)}</span>
                            {!s.available && <span className="text-micro text-muted-foreground">Đã qua giờ chốt</span>}
                          </label>
                        );
                      })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </Section>

        <Section title="Thanh toán">
          <div role="radiogroup" aria-label="Hình thức thanh toán" className="flex flex-col gap-2.5">
            <label className={optionClass(payment === "prepaid")}>
              <input
                type="radio"
                name="payment"
                checked={payment === "prepaid"}
                onChange={() => setChosenPayment("prepaid")}
                disabled={busy}
                className="mt-1 size-[18px] flex-none accent-primary"
              />
              <CreditCard className="mt-0.5 size-5 flex-none text-primary" aria-hidden />
              <span className="text-small text-muted-foreground">
                <span className="block text-title font-semibold text-ink">Thanh toán trước</span>
                Trả tiền ngay sau khi đặt (giả lập cổng thanh toán); hàng được giữ chỗ trong lúc bạn thanh toán.
              </span>
            </label>
            <label className={optionClass(payment === "cod", !q?.codAllowed)}>
              <input
                type="radio"
                name="payment"
                checked={payment === "cod"}
                onChange={() => setChosenPayment("cod")}
                disabled={!q?.codAllowed || busy}
                aria-describedby="cod-note"
                className="mt-1 size-[18px] flex-none accent-primary"
              />
              <Banknote className="mt-0.5 size-5 flex-none text-primary" aria-hidden />
              <span className="text-small text-muted-foreground">
                <span className="block text-title font-semibold text-ink">Tiền mặt khi nhận hàng (COD)</span>
                Kiểm hàng rồi trả tiền cho người giao.
              </span>
            </label>
            {q && !q.codAllowed && (
              <p id="cod-note" className="flex items-start gap-2 rounded-tile border border-warning-line bg-warning-soft px-3.5 py-2.5 text-small text-warning">
                <AlertTriangle className="mt-0.5 size-4 flex-none" aria-hidden />
                <span>COD không áp dụng cho đơn này: {q.codReason ?? "đơn chưa đủ điều kiện thanh toán khi nhận hàng."}</span>
              </p>
            )}
          </div>
        </Section>

        <Section
          title={`Sản phẩm (${cart.items.length})`}
          action={
            <Link href="/gio-hang" className="flex min-h-11 items-center text-small font-semibold text-primary">
              Sửa giỏ hàng
            </Link>
          }
        >
          <ul className="flex flex-col gap-2 text-small">
            {cart.items.map((i) => (
              <li key={i.listingId} className="flex justify-between gap-3">
                <span className="min-w-0 text-ink-2">
                  {i.productName} <span className="text-muted-foreground">× {formatQty(i.quantity)} {i.saleUnit}</span>
                </span>
                <span className="flex-none font-semibold text-ink">{formatVnd(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <aside aria-label="Tóm tắt đơn hàng" className="rounded-panel border border-border p-5 lg:sticky lg:top-4">
        <h2 className="mb-3 text-h3 font-bold text-ink">Đơn hàng</h2>
        {q ? (
          <dl className={cn("flex flex-col gap-2 text-small text-ink-2", requoting && "opacity-60")} aria-busy={requoting}>
            <div className="flex justify-between gap-3">
              <dt>Tiền hàng</dt>
              <dd className="font-semibold text-ink">{formatVnd(q.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Phí giao</dt>
              <dd className={cn("font-semibold", q.shippingFee === 0 ? "text-success" : "text-ink")}>
                {q.shippingFee === 0 ? "Miễn phí" : formatVnd(q.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 text-caption text-muted-foreground">
              <dt>Thuế GTGT (đã gồm trong giá)</dt>
              <dd>{formatVnd(q.taxAmount)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <dt className="text-title text-ink">Tổng cộng</dt>
              <dd className="text-[24px] font-bold leading-tight text-cta">{formatVnd(q.totalAmount)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-small text-muted-foreground">Tổng tiền hiện sau khi chọn địa chỉ giao hàng.</p>
        )}
        <p role="alert" className="mt-3 text-small text-danger empty:hidden">
          {error}
        </p>
        <Button
          type="button"
          onClick={submit}
          disabled={!canPlace}
          aria-busy={placing}
          className="mt-4 hidden h-12 w-full rounded-btn bg-cta text-title font-semibold text-white hover:bg-cta-hover lg:flex"
        >
          {placing ? "Đang đặt đơn…" : "Đặt hàng"}
        </Button>
        <p className="mt-3 text-caption text-muted-foreground">Bấm Đặt hàng là bạn đồng ý với điều khoản mua bán và chính sách đổi trả của Farmery.</p>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">Tổng cộng</p>
          <p className="text-price font-bold text-cta">{q ? formatVnd(q.totalAmount) : "—"}</p>
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={!canPlace}
          aria-busy={placing}
          className="h-12 rounded-btn bg-cta px-6 text-title font-semibold text-white hover:bg-cta-hover"
        >
          {placing ? "Đang đặt…" : "Đặt hàng"}
        </Button>
      </div>
    </div>
  );
}
