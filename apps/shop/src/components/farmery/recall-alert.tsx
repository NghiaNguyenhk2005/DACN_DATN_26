import { TriangleAlert } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { formatDateTimeVi } from "@/lib/format";

/**
 * Cảnh báo thu hồi — đặt ĐẦU trang truy xuất, trên mọi nội dung khác.
 * Mobile: dải full-width dưới header (không bo, viền dưới). Desktop: khung bo 14px.
 */
export function RecallAlert({ recall }: { recall: Schema<"TraceView">["recall"] }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b-[1.5px] border-danger-line bg-danger-soft p-4 md:gap-4 md:rounded-panel md:border-[1.5px] md:px-[22px] md:py-5"
    >
      <TriangleAlert className="size-6 flex-none text-danger md:size-7" aria-hidden />
      <div className="flex-1">
        <h2 className="mb-1.5 text-[16px] font-bold text-danger md:text-[18px]">Lô hàng này đã bị thu hồi</h2>
        <p className="text-[13.5px] leading-[1.6] text-danger-ink md:text-title md:leading-[1.65]">
          {recall.recalledAt && <>Thu hồi ngày {formatDateTimeVi(recall.recalledAt)}. </>}
          {recall.reason && <>Lý do: {recall.reason.replace(/[.\s]+$/, "")}. </>}
          Vui lòng ngừng sử dụng sản phẩm thuộc lô này và liên hệ Farmery để được hoàn tiền.
        </p>
      </div>
    </div>
  );
}
