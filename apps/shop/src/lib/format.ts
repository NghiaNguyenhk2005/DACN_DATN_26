export const formatVnd = (n: number) => n.toLocaleString("vi-VN") + "₫";

/** "2026-10-14" → "14/10/2026" */
export const formatDateVi = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/** Thời điểm ISO (UTC) → ngày theo giờ Việt Nam, dạng "14/10/2026". */
export const formatDateTimeVi = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
