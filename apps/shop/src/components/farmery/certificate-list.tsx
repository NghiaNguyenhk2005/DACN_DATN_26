import { ShieldCheck } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { certValidity, todayVn } from "@/lib/decision";
import { formatDateVi } from "@/lib/format";
import { CERT_LABELS, CERT_VALIDITY_LABELS, type CertValidity } from "@/lib/labels";
import { cn } from "@/lib/utils";

const TONE: Record<CertValidity, string> = {
  valid: "bg-success-soft text-success",
  expiring: "bg-warning-soft text-warning",
  expired: "bg-danger-soft text-danger",
};

/** Danh sách chứng nhận. Hiệu lực theo trường `valid` của API (đã duyệt và chưa hết hiệu lực) + ngày hết hiệu lực. */
export function CertificateList({ items }: { items: Schema<"Certification">[] }) {
  const today = todayVn();
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((c) => {
        const validity = certValidity(c, today);
        const until = `${validity === "expired" ? "Hết hiệu lực từ" : "Hiệu lực đến"} ${formatDateVi(c.expiryDate)}`;
        return (
          <li
            key={`${c.type}-${c.certificateNumber}`}
            className="flex items-start gap-3 rounded-card border border-border px-3.5 py-[13px] md:items-center md:gap-4 md:px-[18px] md:py-3.5"
          >
            <span className={cn("grid size-9 flex-none place-items-center rounded-[9px] md:size-10 md:rounded-tile", TONE[validity])}>
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
                  TONE[validity],
                )}
              >
                {CERT_VALIDITY_LABELS[validity]}
              </span>
              <p className="mt-1 hidden text-[12px] text-subtle md:block">{until}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
