import type { Schema } from "@farmery/contract";
import { formatDateVi } from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { SafeImage } from "./safe-image";

/**
 * Dòng thời gian nhật ký canh tác (cũ → mới). Desktop: [ngày 130px] [trục 22px] [nội dung]; mobile: ngày trên tiêu đề.
 * Nhật ký chỉ nối thêm: dòng bị thay vẫn hiện (chữ mờ, "Đã được đính chính"), dòng sửa có "Bản đính chính" + ghi chú.
 */
export function TraceTimeline({ items, compact }: { items: Schema<"PublicFarmingLog">[]; compact?: boolean }) {
  return (
    <ol className="flex flex-col">
      {items.map((t, i) => {
        const flagged = t.isCorrection || t.superseded;
        const date = formatDateVi(t.activityDate);
        return (
          <li
            key={i}
            className={cn("grid grid-cols-[20px_1fr] gap-x-3", !compact && "md:grid-cols-[130px_22px_1fr] md:gap-x-3.5")}
          >
            {!compact && <time className="hidden py-4 text-small text-subtle md:block">{date}</time>}
            <div aria-hidden className="flex flex-col items-center">
              <div className={cn("h-4 w-[1.5px] bg-line-strong md:h-5", i === 0 && "opacity-0")} />
              <div
                className={cn("size-3 flex-none rounded-full ring-[3px] ring-background", flagged ? "bg-warning-dot" : "bg-success")}
              />
              <div className={cn("w-[1.5px] flex-1 bg-line-strong", i === items.length - 1 && "opacity-0")} />
            </div>
            <div className={cn("pb-3.5 pt-3 md:py-3.5 md:pb-4", t.superseded && "opacity-70")}>
              <time className={cn("mb-0.5 block text-caption text-subtle", !compact && "md:hidden")}>{date}</time>
              <div className="mb-[3px] flex flex-wrap items-center gap-2 md:gap-2.5">
                <h3 className="text-title font-semibold text-ink md:text-[14.5px]">{ACTIVITY_LABELS[t.activity]}</h3>
                {t.superseded && (
                  <span className="rounded-full border border-warning-line bg-warning-soft px-[9px] py-0.5 text-micro font-semibold text-warning">
                    Đã được đính chính
                  </span>
                )}
                {t.isCorrection && (
                  <span className="rounded-full border border-warning-line bg-warning-soft px-[9px] py-0.5 text-micro font-semibold text-warning">
                    Bản đính chính
                  </span>
                )}
              </div>
              {t.description && <p className="text-small text-muted-foreground">{t.description}</p>}
              {t.enteredOnBehalf && <p className="mt-1 text-caption text-subtle">Nhân viên hỗ trợ vùng nhập hộ</p>}
              {t.imageUrls.length > 0 && (
                <ul className="mt-2 flex gap-2">
                  {t.imageUrls.slice(0, 3).map((src) => (
                    <li key={src} className="relative size-14 overflow-hidden rounded-btn border border-line">
                      <SafeImage src={src} alt={`Ảnh ${ACTIVITY_LABELS[t.activity].toLowerCase()} ngày ${date}`} fill sizes="56px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              {t.isCorrection && (
                <p className="mt-2 rounded-btn bg-warning-soft px-3 py-2 text-caption text-warning">
                  Dòng này được ghi thêm để sửa một dòng trước đó; dòng cũ vẫn được giữ nguyên để đối chiếu.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
