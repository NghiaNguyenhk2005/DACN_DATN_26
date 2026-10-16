"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/problem";
import { loginHref, safeNext } from "@/lib/session";
import { addToCartWith, mutate } from "./account";

const ID = /^\d+$/;
const INVALID: ActionResult<never> = { ok: false, message: "Thông tin chưa hợp lệ, vui lòng tải lại trang." };
const validQty = (n: number) => Number.isFinite(n) && n > 0;

/**
 * Nút Thêm / Thêm vào giỏ / Mua ngay. Chưa đăng nhập thì chuyển /dang-nhap kèm món chờ thêm;
 * Mua ngay thêm xong chuyển thẳng /thanh-toan.
 */
export async function addToCart(
  listingId: string,
  quantity: number,
  opts: { returnTo: string; buyNow?: boolean },
): Promise<ActionResult<{ cartCount: number }>> {
  if (!ID.test(listingId) || !validQty(quantity)) return INVALID;
  const target = opts.buyNow ? "/thanh-toan" : safeNext(opts.returnTo);

  const result = await addToCartWith(listingId, quantity);
  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") redirect(loginHref(target, { listingId, quantity }));
    return result;
  }
  if (opts.buyNow) {
    revalidatePath("/", "layout");
    redirect("/thanh-toan");
  }
  refresh();
  return { ok: true, data: { cartCount: result.data.items.length } };
}

export async function setCartQuantity(listingId: string, quantity: number): Promise<ActionResult> {
  if (!ID.test(listingId) || !validQty(quantity)) return INVALID;
  const result = await mutate(
    (api) => api.PUT("/cart/items/{listingId}", { params: { path: { listingId } }, body: { quantity } }),
    "Chưa đổi được số lượng.",
  );
  return settle(result);
}

export async function removeCartItem(listingId: string): Promise<ActionResult> {
  if (!ID.test(listingId)) return INVALID;
  const result = await mutate(
    (api) => api.DELETE("/cart/items/{listingId}", { params: { path: { listingId } } }),
    "Chưa xoá được sản phẩm.",
  );
  return settle(result);
}

function settle(result: ActionResult<unknown>): ActionResult {
  if (!result.ok) {
    if (result.code === "UNAUTHENTICATED") redirect(loginHref("/gio-hang"));
    return result;
  }
  refresh();
  return { ok: true, data: null };
}
