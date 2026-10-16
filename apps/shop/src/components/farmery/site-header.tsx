import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { BackButton } from "./back-button";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";

/**
 * Desktop: logo | ô tìm kiếm (max 520px) | Đăng nhập | Giỏ hàng.
 * Mobile (<md): hàng 1 = [quay lại] logo … tài khoản, giỏ; hàng 2 = ô tìm kiếm cao 44px.
 */
export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 md:flex-nowrap md:px-12 md:py-4">
        <BackButton />
        <Link href="/" aria-label="Farmery — trang chủ" className="mr-auto md:mr-0">
          <Logo size={22} className="md:hidden" />
          <Logo size={24} className="hidden md:inline-flex" />
        </Link>

        <Suspense
          fallback={
            <div className="order-last h-11 w-full rounded-search border border-border bg-surface md:order-none md:max-w-[520px] md:flex-1" />
          }
        >
          <SearchBox />
        </Suspense>

        <div className="flex items-center gap-1 md:ml-auto md:gap-5">
          <Link
            href="/dang-nhap"
            className="flex min-h-11 min-w-11 items-center justify-center gap-[7px] text-title font-medium text-ink-2 md:min-w-0"
          >
            <User className="size-6 md:size-[19px]" aria-hidden />
            <span className="hidden md:inline">Đăng nhập</span>
            <span className="sr-only md:hidden">Đăng nhập</span>
          </Link>
          <Link
            href="/gio-hang"
            className="relative flex min-h-11 min-w-11 items-center justify-center md:min-w-0"
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
          >
            <ShoppingBag className="size-6 text-primary md:size-[21px]" aria-hidden />
            {cartCount > 0 && (
              <span className="absolute right-0 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-white md:-right-2 md:-top-1.5">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
