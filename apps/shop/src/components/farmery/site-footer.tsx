import Link from "next/link";
import { ApiStatus } from "@/components/api-status";
import type { NavCategory } from "./category-nav";
import { Logo } from "./logo";

/** Nền #14261a. Desktop: lưới 2fr 1fr 1fr. Mobile: giới thiệu + lưới 2 cột. */
export function SiteFooter({ categories }: { categories: NavCategory[] }) {
  const cols = [
    { title: "Đi chợ", links: categories },
    {
      title: "Truy xuất",
      links: [
        { label: "Tra nguồn gốc lô hàng", href: "/#tra-nguon-goc" },
        { label: "Tìm sản phẩm", href: "/tim-kiem" },
      ],
    },
  ].filter((c) => c.links.length > 0);

  return (
    <footer className="mt-12 bg-dark px-4 pb-5 pt-7 text-dark-text md:px-12 md:pb-6 md:pt-11">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-[18px] md:grid-cols-[2fr_1fr_1fr] md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo variant="full-dark" size={21} className="mb-[9px]" />
            <p className="max-w-[300px] text-small leading-[1.65]">
              Chợ nông sản trực tuyến nối nhà vườn, hợp tác xã với bếp nhà — biết rõ ai trồng, trồng ở đâu, thu hoạch
              ngày nào.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h2 className="mb-[11px] text-small font-semibold text-white">{c.title}</h2>
              <ul className="flex flex-col gap-2 text-small">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-dark-text hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-[30px] flex flex-wrap items-center justify-between gap-2 border-t border-dark-line pt-[18px] text-[12px] text-[#9aab97]">
          <span>© 2026 Farmery</span>
          <ApiStatus />
        </div>
      </div>
    </footer>
  );
}
