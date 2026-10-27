import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { CartLineControls } from "@/components/farmery/cart-line-controls";
import { CheckoutSteps } from "@/components/farmery/checkout-steps";
import { EmptyState } from "@/components/farmery/empty-state";
import { isNotImplemented, NotReadyState } from "@/components/farmery/not-ready-state";
import { SafeImage } from "@/components/farmery/safe-image";
import { getCart, requireViewer } from "@/lib/data/account";
import { formatQty, formatVnd } from "@/lib/format";
import { problemMessage } from "@/lib/problem";
import { productHref } from "@/lib/slug";

export const metadata: Metadata = { title: "Giỏ hàng" };

/** Dòng vượt lượng còn bán được: chặn bước thanh toán, nhắc giảm số lượng. */
const overStock = (i: Schema<"CartItem">) => i.quantity > i.available;

export default async function CartPage({ searchParams }: PageProps<"/gio-hang">) {
  const { loi } = await searchParams;
  let cart: Schema<"Cart">;
  try {
    await requireViewer("/gio-hang");
    cart = await getCart();
  } catch (e) {
    if (isNotImplemented(e)) return <NotReadyState />;
    throw e;
  }

  // Thêm vào giỏ ngay sau đăng nhập không thành (vd vượt tồn): trang đăng nhập chuyển về đây kèm mã lỗi.
  const addError =
    typeof loi === "string" ? problemMessage({ code: loi }, 0, "Chưa thêm được sản phẩm vào giỏ. Vui lòng thử lại.") : null;
  const blocked = cart.items.some(overStock);

  return (
    <div className="pb-28 lg:pb-10">
      <CheckoutSteps current={0} />
      <h1 className="mb-4 font-serif text-h1-sm font-bold text-ink md:text-h1">
        Giỏ hàng {cart.items.length > 0 && <span className="font-sans text-title font-medium text-muted-foreground">({cart.items.length} sản phẩm)</span>}
      </h1>

      {addError && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-tile border border-danger-line bg-danger-soft px-4 py-3 text-small text-danger-ink">
          <AlertTriangle className="mt-0.5 size-4 flex-none text-danger" aria-hidden /> {addError}
        </p>
      )}

      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Giỏ hàng đang trống"
          description="Chọn nông sản đang vào mùa và bấm Thêm vào giỏ."
          action={{ label: "Tiếp tục mua sắm", href: "/" }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <ul className="flex flex-col divide-y divide-line rounded-panel border border-border px-4 md:px-5">
            {cart.items.map((item) => (
              <li key={item.listingId} className="flex gap-3 py-4 md:gap-4">
                <Link
                  href={productHref({ id: item.productId, name: item.productName })}
                  className="relative size-16 flex-none overflow-hidden rounded-tile md:size-[76px]"
                  aria-label={item.productName}
                >
                  <SafeImage src={item.imageUrl} alt="" fill sizes="76px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <Link
                        href={productHref({ id: item.productId, name: item.productName })}
                        className="text-title font-semibold text-ink hover:text-primary-hover"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-caption text-muted-foreground">
                        {formatVnd(item.unitPrice)} / {item.saleUnit}
                      </p>
                    </div>
                    <p className="text-price font-bold text-ink">{formatVnd(item.lineTotal)}</p>
                  </div>
                  {overStock(item) && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-micro font-medium text-danger">
                      <AlertTriangle className="size-3.5 flex-none" aria-hidden />
                      {item.available > 0
                        ? `Chỉ còn ${formatQty(item.available)} ${item.saleUnit} — giảm số lượng để đặt hàng.`
                        : "Sản phẩm đã hết hàng — xoá khỏi giỏ để đặt hàng."}
                    </p>
                  )}
                  <div className="mt-2">
                    <CartLineControls
                      listingId={item.listingId}
                      productName={item.productName}
                      quantity={item.quantity}
                      available={item.available}
                      saleUnit={item.saleUnit}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <CartSummary subtotal={cart.subtotal} blocked={blocked} />
        </div>
      )}
    </div>
  );
}

function CartSummary({ subtotal, blocked }: { subtotal: number; blocked: boolean }) {
  const checkout = blocked ? (
    <span aria-disabled className="grid h-12 cursor-not-allowed place-items-center rounded-btn bg-cta/50 px-6 text-title font-semibold text-white">
      Thanh toán
    </span>
  ) : (
    <Link href="/thanh-toan" className="grid h-12 place-items-center rounded-btn bg-cta px-6 text-title font-semibold text-white hover:bg-cta-hover">
      Thanh toán
    </Link>
  );

  return (
    <>
      <aside aria-label="Tóm tắt giỏ hàng" className="rounded-panel border border-border p-5 lg:sticky lg:top-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-title text-ink-2">Tạm tính</span>
          <span className="text-h3 font-bold text-ink">{formatVnd(subtotal)}</span>
        </div>
        <p className="mb-4 text-caption text-muted-foreground">Giá đã gồm thuế GTGT. Phí giao tính ở bước thanh toán.</p>
        {blocked && <p className="mb-3 text-small text-danger">Có sản phẩm vượt lượng còn bán, vui lòng sửa số lượng.</p>}
        <div className="hidden flex-col gap-2.5 lg:flex">
          {checkout}
          <Link href="/" className="grid h-11 place-items-center text-small font-semibold text-primary">
            Tiếp tục mua sắm
          </Link>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">Tạm tính</p>
          <p className="text-price font-bold text-ink">{formatVnd(subtotal)}</p>
        </div>
        {checkout}
      </div>
    </>
  );
}
