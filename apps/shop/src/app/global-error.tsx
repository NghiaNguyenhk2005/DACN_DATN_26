"use client";

import { ErrorState } from "@/components/farmery/error-state";
import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="vi">
      <body>
        <title>Lỗi · Farmery</title>
        <ErrorState title="Đã có lỗi xảy ra" description="Vui lòng tải lại trang." onRetry={() => retry()} />
      </body>
    </html>
  );
}
