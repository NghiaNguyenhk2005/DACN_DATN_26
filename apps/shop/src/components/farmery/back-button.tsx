"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Số trang đã đi qua trong ứng dụng từ lần tải trang đầu; NavigationTracker (layout gốc) cập nhật.
let visited = 0;
let lastPath: string | null = null;

export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== lastPath) {
      lastPath = pathname;
      visited += 1;
    }
  }, [pathname]);
  return null;
}

/** Nút quay lại ở đầu trang bản điện thoại; ẩn ở trang chủ. Mở thẳng từ ngoài vào thì về trang chủ. */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;
  return (
    <button
      type="button"
      aria-label="Quay lại"
      onClick={() => (visited > 1 ? router.back() : router.push("/"))}
      className="-my-2 -ml-3 grid size-11 place-items-center text-ink-2 md:hidden"
    >
      <ChevronLeft className="size-[22px]" />
    </button>
  );
}
