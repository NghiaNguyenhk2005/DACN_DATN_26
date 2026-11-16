"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackagePlus, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/nha-cung-cap", label: "Tổng quan", match: (p: string) => p === "/nha-cung-cap" || p.startsWith("/nha-cung-cap/bao-gia") },
  { href: "/nha-cung-cap/lo-hang", label: "Lô hàng", badge: "batches", match: (p: string) => p.startsWith("/nha-cung-cap/lo-hang") },
  { href: "/nha-cung-cap/san-pham", label: "Sản phẩm", match: (p: string) => p.startsWith("/nha-cung-cap/san-pham") },
  { href: "/nha-cung-cap/don-thu-mua", label: "Đơn thu mua", match: (p: string) => p.startsWith("/nha-cung-cap/don-thu-mua") },
  { href: "/nha-cung-cap/ho-so", label: "Hồ sơ & chứng nhận", badge: "profile", match: (p: string) => p.startsWith("/nha-cung-cap/ho-so") },
] as const;

type Badges = { batches: number; profile: number };

/**
 * Điều hướng khu nhà cung cấp (design/02 §2): tab là nơi đến, gạch chân như tab trang chi tiết; badge là số việc cần
 * xử lý. Hành động là nút ở phải ("Khai báo lô" cam, "Đăng sản phẩm" viền); mobile nút chính dính đáy.
 */
export function SellerNav({ badges }: { badges: Badges }) {
  const pathname = usePathname();
  const creating = pathname.endsWith("/tao-moi");
  return (
    <>
      <div className="flex items-end justify-between gap-4 border-b border-line">
        <nav aria-label="Khu nhà cung cấp" className="scrollbar-none -mb-px flex gap-6 overflow-x-auto md:gap-7">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const count = "badge" in tab ? badges[tab.badge] : 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent py-3 text-title font-medium text-subtle hover:text-ink",
                  active && "border-primary font-semibold text-primary hover:text-primary",
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-micro font-bold text-white" aria-label={`${count} việc cần xử lý`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="hidden flex-none items-center gap-2.5 pb-2 md:flex">
          <Link
            href="/nha-cung-cap/san-pham/tao-moi"
            className="inline-flex h-10 items-center gap-2 rounded-btn border-[1.5px] border-primary px-3.5 text-small font-semibold text-primary hover:bg-surface hover:text-primary"
          >
            <PackagePlus className="size-4" aria-hidden />
            Đăng sản phẩm
          </Link>
          <Link
            href="/nha-cung-cap/lo-hang/tao-moi"
            className="inline-flex h-10 items-center gap-2 rounded-btn bg-cta px-4 text-small font-semibold text-white hover:bg-cta-hover hover:text-white"
          >
            <PlusCircle className="size-4" aria-hidden />
            Khai báo lô
          </Link>
        </div>
      </div>

      {!creating && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden">
          <Link
            href="/nha-cung-cap/lo-hang/tao-moi"
            className="flex h-12 items-center justify-center gap-2 rounded-btn bg-cta text-title font-semibold text-white hover:bg-cta-hover hover:text-white"
          >
            <PlusCircle className="size-5" aria-hidden />
            Khai báo lô
          </Link>
        </div>
      )}
    </>
  );
}
