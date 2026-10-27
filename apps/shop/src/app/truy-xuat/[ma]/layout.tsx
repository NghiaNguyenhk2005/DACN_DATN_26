import Link from "next/link";
import { Logo } from "@/components/farmery/logo";

/** Trang mở khi quét QR trên tem: đầu trang gọn (logo + "Truy xuất nguồn gốc"), không thanh danh mục. */
export default function TraceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 md:px-12 md:py-4">
          <Link href="/" aria-label="Farmery — trang chủ">
            <Logo size={22} className="md:hidden" />
            <Logo size={24} className="hidden md:inline-flex" />
          </Link>
          <span className="text-small font-semibold text-primary md:text-title">Truy xuất nguồn gốc</span>
        </div>
      </header>
      {children}
    </div>
  );
}
