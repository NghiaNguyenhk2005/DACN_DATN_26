"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Package, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/nha-cung-cap",
    label: "Sản phẩm của tôi",
    icon: Package,
    exact: true,
  },
  {
    href: "/nha-cung-cap/lo-hang",
    label: "Quản lý lô hàng",
    icon: Layers,
    exact: false,
    // match /nha-cung-cap/lo-hang and /nha-cung-cap/lo-hang/[id] but not /tao-moi
    isActive: (pathname: string) =>
      pathname === "/nha-cung-cap/lo-hang" ||
      (pathname.startsWith("/nha-cung-cap/lo-hang/") && !pathname.endsWith("/tao-moi")),
  },
  {
    href: "/nha-cung-cap/lo-hang/tao-moi",
    label: "Khai báo lô mới",
    icon: PlusCircle,
    exact: true,
  },
];

export function SellerNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-1 overflow-x-auto pb-1" aria-label="Điều hướng Khu nhà cung cấp">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive
          ? tab.isActive(pathname)
          : tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-title font-medium transition-all",
              active
                ? "bg-primary text-white shadow-xs font-semibold"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
