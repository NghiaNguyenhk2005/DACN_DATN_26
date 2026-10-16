"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Schema } from "@farmery/contract";
import type { ActionResult } from "@/lib/problem";
import { loginHref } from "@/lib/session";
import { mutate } from "./account";

const ID = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVALID = { ok: false, message: "Thông tin chưa hợp lệ, vui lòng tải lại trang." } as const;

export type AddressFormState = { message: string; values: Record<string, string> } | null;

const ADDRESS_FIELDS = ["label", "recipientName", "phone", "addressLine", "ward", "province"] as const;

/** Thêm địa chỉ ở trang thanh toán; xong thì chọn luôn địa chỉ mới. */
export async function createAddress(_prev: AddressFormState, formData: FormData): Promise<AddressFormState> {
  const values = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, String(formData.get(k) ?? "").trim()]));
  const missing = ADDRESS_FIELDS.filter((k) => k !== "label" && !values[k]);
  if (missing.length) return { message: "Vui lòng điền đủ các ô bắt buộc.", values };
  if (!/^0\d{9}$/.test(values.phone.replace(/[\s.]/g, ""))) {
    return { message: "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.", values };
  }

  const body: Schema<"AddressInput"> = {
    recipientName: values.recipientName,
    phone: values.phone.replace(/[\s.]/g, ""),
    addressLine: values.addressLine,
    ward: values.ward,
    province: values.province,
    isDefault: formData.get("isDefault") === "on",
    ...(values.label ? { label: values.label } : {}),
  };
  const result = await mutate((api) => api.POST("/me/addresses", { body }), "Chưa lưu được địa chỉ.");
  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") redirect(loginHref("/thanh-toan"));
    return { message: result.message, values };
  }
  redirect(`/thanh-toan?dia-chi=${result.data.id}`);
}

export interface PlaceOrderInput {
  addressId: string;
  deliveryDate: string;
  deliverySlot: string;
  paymentOption: Schema<"PaymentOption">;
  /** UUID sinh một lần mỗi lần mở trang thanh toán: gửi lại không tạo đơn thứ hai. */
  idempotencyKey: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult> {
  if (
    !ID.test(input.addressId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.deliveryDate) ||
    !input.deliverySlot ||
    (input.paymentOption !== "prepaid" && input.paymentOption !== "cod") ||
    !UUID.test(input.idempotencyKey)
  ) {
    return INVALID;
  }
  const { idempotencyKey, ...body } = input;
  const result = await mutate(
    (api) => api.POST("/orders", { params: { header: { "Idempotency-Key": idempotencyKey } }, body }),
    "Chưa đặt được đơn. Vui lòng thử lại.",
  );
  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") redirect(loginHref("/thanh-toan"));
    return result;
  }
  // Giỏ vừa được làm rỗng: tải lại cả layout để số món ở đầu trang về 0.
  revalidatePath("/", "layout");
  redirect(`/don-hang/${result.data.id}`);
}

/** Thanh toán giả lập cho đơn trả trước (thay cổng thanh toán ở prototype). */
export async function payOrder(orderId: string): Promise<ActionResult> {
  if (!ID.test(orderId)) return INVALID;
  const result = await mutate(
    (api) => api.POST("/orders/{orderId}/pay", { params: { path: { orderId } } }),
    "Chưa thanh toán được. Vui lòng thử lại.",
  );
  return settle(result, orderId);
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  if (!ID.test(orderId)) return INVALID;
  const result = await mutate(
    (api) => api.POST("/orders/{orderId}/cancel", { params: { path: { orderId } } }),
    "Chưa huỷ được đơn. Vui lòng thử lại.",
  );
  return settle(result, orderId);
}

function settle(result: ActionResult<unknown>, orderId: string): ActionResult {
  // Lỗi nghiệp vụ (vd hết giờ giữ chỗ) cũng làm mới trang để hiện trạng thái đơn mới nhất.
  if (!result.ok && result.code === "UNAUTHENTICATED") redirect(loginHref(`/don-hang/${orderId}`));
  refresh();
  return result.ok ? { ok: true, data: null } : result;
}
