import { ShieldCheck } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { formatDateVi } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Danh sách chứng nhận. Còn hạn / Hết hạn theo trường `valid` do API trả (đã duyệt và chưa hết hạn). */
export function CertificateList({ items }: { items: Schema<"Certification">[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((c) => {
        const ok = c.valid;
        const until = `${ok ? "Đến" : "Hết hạn"} ${formatDateVi(c.expiryDate)}`;
        return (
          <li
            key={`${c.type}-${c.certificateNumber}`}
            className="flex items-start gap-3 rounded-card border border-border px-3.5 py-[13px] md:items-center md:gap-4 md:px-[18px] md:py-3.5"
          >
            <span
              className={cn(
                "grid size-9 flex-none place-items-center rounded-[9px] md:size-10 md:rounded-tile",
                ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
              )}
            >
              <ShieldCheck className="size-[18px] md:size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title font-semibold text-ink md:text-[14.5px]">{CERT_LABELS[c.type]}</p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                Số {c.certificateNumber} · {c.issuingAuthority} · Cấp {formatDateVi(c.issuedDate)}
              </p>
              <p className="mt-[3px] text-[12px] text-subtle md:hidden">{until}</p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold md:px-3 md:text-caption",
                  ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                )}
              >
                {ok ? "Còn hạn" : "Hết hạn"}
              </span>
              <p className="mt-1 hidden text-[12px] text-subtle md:block">{until}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
