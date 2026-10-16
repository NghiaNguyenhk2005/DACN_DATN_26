export const formatVnd = (n: number) => n.toLocaleString("vi-VN") + "₫";

/** "2026-10-14" → "14/10/2026" */
export const formatDateVi = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/** Thời điểm ISO (UTC) → ngày theo giờ Việt Nam, dạng "14/10/2026". */
export const formatDateTimeVi = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });

/** "2026-10-18" → "Thứ Bảy, 18/10" (ngày giao, không phụ thuộc múi giờ máy). */
export const formatDayVi = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "2-digit" });

/** Khung giờ giao "08:00-11:00" → "8:00 – 11:00". */
export const formatSlot = (slot: string) => slot.replace(/^0/, "").replace(/-0?/, " – ");

/** Số lượng theo đơn vị bán: 1,5 / 2 */
export const formatQty = (n: number) => n.toLocaleString("vi-VN");
