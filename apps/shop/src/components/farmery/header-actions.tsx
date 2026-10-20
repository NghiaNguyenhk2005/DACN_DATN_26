"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Factory, LogOut, ReceiptText, Search, ShoppingBag, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/data/auth-actions";
import { cn } from "@/lib/utils";

/** Trang danh mục, chi tiết: đầu trang mobile gọn một hàng (kính lúp thay ô tìm kiếm, ẩn tài khoản). */
export function useCompactHeader() {
  const pathname = usePathname();
  return pathname.startsWith("/danh-muc/") || pathname.startsWith("/san-pham/");
}

const accountClass = "flex min-h-11 min-w-11 items-center justify-center gap-[7px] text-title font-medium text-ink-2 md:min-w-0";

function LoginLink({ compact }: { compact: boolean }) {
  const pathname = usePathname();
  // Quay lại đúng trang đang xem sau khi đăng nhập (trừ chính trang đăng nhập).
  const href = pathname === "/dang-nhap" || pathname === "/" ? "/dang-nhap" : `/dang-nhap?next=${encodeURIComponent(pathname)}`;
  return (
    <Link href={href} className={cn(accountClass, compact && "max-md:hidden")}>
      <User className="size-6 md:size-[19px]" aria-hidden />
      <span className="hidden md:inline">Đăng nhập</span>
      <span className="sr-only md:hidden">Đăng nhập</span>
    </Link>
  );
}

function AccountMenu({ displayName, compact, isSeller }: { displayName: string; compact: boolean; isSeller: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(accountClass, "cursor-pointer rounded-btn outline-none focus-visible:ring-2 focus-visible:ring-ring", compact && "max-md:hidden")}
        aria-label={`Tài khoản: ${displayName}`}
      >
        <User className="size-6 md:size-[19px]" aria-hidden />
        <span className="hidden max-w-[140px] truncate md:inline">{displayName}</span>
        <ChevronDown className="hidden size-3.5 md:inline" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-card p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2 text-small text-muted-foreground">
            Xin chào, <span className="font-semibold text-ink">{displayName}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/gio-hang" />}
          className="min-h-11 gap-2.5 px-2.5 text-title text-ink-2"
        >
          <ShoppingBag className="size-[18px]" aria-hidden /> Giỏ hàng
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/don-hang" />}
          className="min-h-11 gap-2.5 px-2.5 text-title text-ink-2"
        >
          <ReceiptText className="size-[18px]" aria-hidden /> Đơn hàng
        </DropdownMenuItem>
        {isSeller && (
          <DropdownMenuItem
            render={<Link href="/nha-cung-cap" />}
            className="min-h-11 gap-2.5 px-2.5 text-title text-ink-2"
          >
            <Factory className="size-[18px]" aria-hidden /> Khu nhà cung cấp
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={pending}
          onClick={() => startTransition(() => logout())}
          className="min-h-11 gap-2.5 px-2.5 text-title text-ink-2"
        >
          <LogOut className="size-[18px]" aria-hidden /> {pending ? "Đang đăng xuất…" : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HeaderActions({
  displayName,
  cartCount = 0,
  isSeller = false,
}: {
  displayName?: string | null;
  cartCount?: number;
  isSeller?: boolean;
}) {
  const compact = useCompactHeader();
  return (
    <div className="flex items-center gap-1 md:ml-auto md:gap-5">
      {isSeller && (
        <Link
          href="/nha-cung-cap"
          className="hidden items-center gap-1.5 rounded-btn bg-leaf-soft/60 px-3 py-1.5 text-title font-medium text-primary transition-colors hover:bg-leaf-soft lg:inline-flex"
      >
          <Factory className="size-4" aria-hidden />
          <span>Khu nhà cung cấp</span>
        </Link>
      )}
      {compact && (
        <Link href="/tim-kiem" aria-label="Tìm kiếm" className="grid size-11 place-items-center text-ink-2 md:hidden">
          <Search className="size-[22px]" aria-hidden />
        </Link>
      )}
      {displayName ? <AccountMenu displayName={displayName} compact={compact} isSeller={isSeller} /> : <LoginLink compact={compact} />}
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
