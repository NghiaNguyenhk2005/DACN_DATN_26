import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";

type Detail = Schema<"ReviewTaskDetail">;
export type Check = { label: string; ok: boolean };

const today = () => dayjs().format("YYYY-MM-DD");

/** Mục đối chiếu tự tính theo loại việc duyệt (design/05 A2); chỉ để tham khảo, quyết định vẫn do kiểm duyệt viên. */
export function reviewChecks(task: Detail): Check[] {
  if (task.batch) {
    const { batch, logs, certifications } = task.batch;
    const live = logs.filter((l) => !l.superseded);
    return [
      { label: "Ngày thu hoạch không ở tương lai", ok: batch.harvestDate <= today() },
      { label: "Nhật ký có lần thu hoạch", ok: live.some((l) => l.activity === "harvest") },
      { label: "Nhật ký có ảnh minh chứng", ok: live.some((l) => l.imageUrls.length > 0) },
      {
        label: "Có chứng nhận còn hiệu lực tới sau hạn sử dụng của lô",
        ok: certifications.some((c) => c.valid && c.expiryDate >= batch.bestBefore),
      },
    ];
  }
  if (task.certification) {
    const c = task.certification.certification;
    return [
      { label: "Ngày hết hiệu lực sau ngày cấp", ok: c.expiryDate > c.issuedDate },
      { label: "Còn hiệu lực ít nhất 30 ngày", ok: dayjs(c.expiryDate).diff(dayjs(), "day") >= 30 },
      { label: "Có ảnh/bản scan chứng nhận", ok: Boolean(task.certification.documentUrl) },
    ];
  }
  if (task.product) {
    const p = task.product.product;
    return [
      { label: "Có mô tả sản phẩm", ok: Boolean(p.description?.trim()) },
      { label: "Có ảnh sản phẩm", ok: (p.imageUrls?.length ?? 0) > 0 },
      { label: "Đơn vị bán ghi rõ khối lượng (vd hộp 500g, kg)", ok: /\d+\s*(g|kg)\b|^kg$/i.test(p.unit.trim()) },
      { label: "Có giá bán lẻ tham khảo", ok: p.referenceRetailPrice != null },
    ];
  }
  return [];
}

export const REJECT_TEMPLATES: Record<string, string[]> = {
  batch: [
    "Nhật ký chưa có lần thu hoạch.",
    "Thiếu ảnh minh chứng trong nhật ký.",
    "Chứng nhận hết hiệu lực trước hạn sử dụng của lô.",
    "Sản lượng khai báo chưa khớp với nhật ký.",
  ],
  certification: ["Ảnh chứng nhận không đọc được.", "Số chứng nhận không khớp cơ quan cấp.", "Chứng nhận đã hết hiệu lực."],
  product: ["Thiếu ảnh sản phẩm.", "Đơn vị bán cần ghi rõ khối lượng.", "Mô tả chưa đủ thông tin giống, cách trồng."],
};
