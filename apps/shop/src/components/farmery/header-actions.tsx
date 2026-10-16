"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

/** Trang danh mục, chi tiết: đầu trang mobile gọn một hàng (kính lúp thay ô tìm kiếm, ẩn tài khoản). */
export function useCompactHeader() {
  const pathname = usePathname();
  return pathname.startsWith("/danh-muc/") || pathname.startsWith("/san-pham/");
}

export function HeaderActions({ cartCount = 0 }: { cartCount?: number }) {
  const compact = useCompactHeader();
  return (
    <div className="flex items-center gap-1 md:ml-auto md:gap-5">
      {compact && (
        <Link href="/tim-kiem" aria-label="Tìm kiếm" className="grid size-11 place-items-center text-ink-2 md:hidden">
          <Search className="size-[22px]" aria-hidden />
        </Link>
      )}
      <Link
        href="/dang-nhap"
        className={cn(
          "flex min-h-11 min-w-11 items-center justify-center gap-[7px] text-title font-medium text-ink-2 md:min-w-0",
          compact && "max-md:hidden",
        )}
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
  );
}
