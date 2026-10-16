import { cn } from "@/lib/utils";

export interface LotFact {
  label: string;
  value: string;
  /** Tô màu giá trị, vd "danger" cho hạn dùng của lô bị thu hồi */
  tone?: "default" | "danger";
}

/**
 * Khối thông tin lô — lưới ô thông tin.
 * Chi tiết sản phẩm: 2 cột. Trang truy xuất: 4 cột desktop / 2 cột mobile.
 */
export function LotInfo({ facts, columns = 2 }: { facts: LotFact[]; columns?: 2 | 4 }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-2.5 md:gap-3", columns === 4 && "md:grid-cols-4")}>
      {facts.map((f) => (
        <div key={f.label} className="rounded-tile border border-line px-[13px] py-[11px] md:px-[15px] md:py-[13px]">
          <dt className="mb-[3px] text-micro text-subtle">{f.label}</dt>
          <dd className={cn("text-small font-semibold text-ink md:text-title", f.tone === "danger" && "text-danger")}>
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
