"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createAddress, type AddressFormState } from "@/lib/data/order-actions";

const inputClass =
  "h-11 w-full rounded-btn border border-border bg-background px-3.5 text-[15px] text-ink outline-none placeholder:text-faint focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-ring/40";

function Field({ name, label, optional, ...rest }: { name: string; label: string; optional?: boolean } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5 text-small font-semibold text-ink-2">
      <span>
        {label} {optional && <span className="font-normal text-muted-foreground">(không bắt buộc)</span>}
      </span>
      <input name={name} required={!optional} className={inputClass} {...rest} />
    </label>
  );
}

/** Thêm địa chỉ giao hàng (địa giới hai cấp: phường/xã, tỉnh/thành). Lưu xong trang tự chọn địa chỉ mới. */
export function AddressForm({ onCancel }: { onCancel?: () => void }) {
  const [state, action, pending] = useActionState<AddressFormState, FormData>(createAddress, null);
  const v = state?.values ?? {};
  return (
    <form action={action} className="grid gap-3 rounded-card border border-line-strong bg-surface p-4 sm:grid-cols-2">
      <Field name="recipientName" label="Họ tên người nhận" autoComplete="name" defaultValue={v.recipientName} />
      <Field name="phone" label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" defaultValue={v.phone} />
      <div className="sm:col-span-2">
        <Field name="addressLine" label="Số nhà, tên đường" autoComplete="street-address" defaultValue={v.addressLine} />
      </div>
      <Field name="ward" label="Phường / xã" placeholder="Phường Bến Thành" defaultValue={v.ward} />
      <Field name="province" label="Tỉnh / thành phố" defaultValue={v.province ?? "TP. Hồ Chí Minh"} />
      <Field name="label" label="Tên gợi nhớ" optional placeholder="Nhà riêng, Cơ quan…" defaultValue={v.label} />
      <label className="flex min-h-11 items-center gap-2.5 self-end text-small text-ink-2">
        <input type="checkbox" name="isDefault" className="size-5 accent-primary" />
        Đặt làm địa chỉ mặc định
      </label>
      <p role="alert" className="text-small text-danger sm:col-span-2 empty:hidden">
        {state?.message}
      </p>
      <div className="flex gap-2.5 sm:col-span-2">
        <Button type="submit" disabled={pending} aria-busy={pending} className="h-11 rounded-btn bg-primary px-5 text-title font-semibold text-white hover:bg-primary-hover">
          {pending ? "Đang lưu…" : "Lưu địa chỉ"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-11 rounded-btn px-5 text-title">
            Huỷ
          </Button>
        )}
      </div>
    </form>
  );
}
