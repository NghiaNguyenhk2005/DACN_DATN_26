import type { Schema } from "@farmery/contract";
import { formatVnd } from "@/lib/format";

export function AnnouncementBar({ settings }: { settings: Schema<"DeliverySettings"> | null }) {
  return (
    <div className="border-b border-line bg-surface text-small text-ink-2">
      <div className="mx-auto max-w-[1440px] px-4 py-2 md:px-12 md:py-[9px]">
        <p className="truncate text-[12px] md:text-small">
          Giao tại TP.HCM
          {settings && ` · Miễn phí giao từ ${formatVnd(settings.freeShippingThreshold)} · Đặt trước ${settings.cutoffTime}`}
        </p>
      </div>
    </div>
  );
}
