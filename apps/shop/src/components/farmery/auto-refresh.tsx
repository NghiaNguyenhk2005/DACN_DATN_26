"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dựng lại Server Component theo chu kỳ (hỏi lại thay cho SSE ở prototype); tạm dừng khi tab bị ẩn. */
export function AutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}
