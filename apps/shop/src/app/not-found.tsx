import Link from "next/link";
import { Logo } from "@/components/farmery/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" aria-label="Farmery — trang chủ" className="mb-8">
        <Logo size={24} />
      </Link>
      <h1 className="mb-2 font-serif text-h1-sm font-bold text-ink md:text-h1">Không tìm thấy trang</h1>
      <p className="mb-6 text-small text-muted-foreground">Đường dẫn không tồn tại hoặc đã được thay đổi.</p>
      <Link
        href="/"
        className="grid h-11 place-items-center rounded-btn bg-primary px-5 text-title font-semibold text-white hover:bg-primary-hover hover:text-white"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
