import { Suspense } from "react";
import Link from "next/link";
import { getHeaderAccount } from "@/lib/data/account";
import { BackButton } from "./back-button";
import { HeaderActions } from "./header-actions";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";

/**
 * Desktop: logo | ô tìm kiếm (max 520px) | tài khoản | giỏ (tên, số món tải riêng trong Suspense).
 * Mobile (<md): hàng 1 = [quay lại] logo … tài khoản, giỏ; hàng 2 = ô tìm kiếm cao 44px.
 * Trang danh mục, chi tiết ở mobile chỉ còn hàng 1 (kính lúp thay ô tìm kiếm).
 */
export function SiteHeader() {
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

        <Suspense fallback={<HeaderActions />}>
          <HeaderAccount />
        </Suspense>
      </div>
    </header>
  );
}

async function HeaderAccount() {
  const account = await getHeaderAccount();
  return <HeaderActions displayName={account?.displayName} cartCount={account?.cartCount} />;
}
