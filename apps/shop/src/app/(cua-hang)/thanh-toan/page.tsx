import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { CheckoutForm } from "@/components/farmery/checkout-form";
import { CheckoutSteps } from "@/components/farmery/checkout-steps";
import { EmptyState } from "@/components/farmery/empty-state";
import { isNotImplemented, NotReadyState } from "@/components/farmery/not-ready-state";
import { getAddresses, getCart, getQuote, requireViewer } from "@/lib/data/account";

export const metadata: Metadata = { title: "Thanh toán" };

export default async function CheckoutPage({ searchParams }: PageProps<"/thanh-toan">) {
  const sp = await searchParams;
  let data;
  try {
    await requireViewer("/thanh-toan");
    const [cart, addresses] = await Promise.all([getCart(), getAddresses()]);
    const wanted = typeof sp["dia-chi"] === "string" ? sp["dia-chi"] : null;
    const address = addresses.find((a) => a.id === wanted) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
    const quote = address && cart.items.length > 0 ? await getQuote(address.id) : null;
    data = { cart, addresses, address, quote };
  } catch (e) {
    if (isNotImplemented(e)) return <NotReadyState />;
    throw e;
  }
  const { cart, addresses, address, quote } = data;

  return (
    <div className="pb-28 lg:pb-10">
      <CheckoutSteps current={1} />
      <h1 className="mb-4 font-serif text-h1-sm font-bold text-ink md:text-h1">Giao hàng & thanh toán</h1>
      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Giỏ hàng đang trống"
          description="Thêm sản phẩm vào giỏ trước khi thanh toán."
          action={{ label: "Tiếp tục mua sắm", href: "/" }}
        />
      ) : (
        <CheckoutForm
          key={addresses.length}
          cart={cart}
          addresses={addresses}
          selectedAddressId={address?.id ?? null}
          quote={quote}
          idempotencyKey={randomUUID()}
        />
      )}
    </div>
  );
}
