"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/farmery/error-state";

export default function TraceError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4">
      <ErrorState
        title="Không tra cứu được lô hàng"
        description="Máy chủ Farmery đang không phản hồi. Vui lòng thử lại sau ít phút."
        onRetry={() => retry()}
      />
    </div>
  );
}
