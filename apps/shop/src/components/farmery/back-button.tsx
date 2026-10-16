"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Nút quay lại ở đầu trang bản điện thoại; ẩn ở trang chủ. */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;
  return (
    <button
      type="button"
      aria-label="Quay lại"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-my-2 -ml-3 grid size-11 place-items-center text-ink-2 md:hidden"
    >
      <ChevronLeft className="size-[22px]" />
    </button>
  );
}
