import type { Schema } from "@farmery/contract";
import type { CertValidity } from "./labels";

// Thông tin hỗ trợ ra quyết định (design/05): độ tươi, giá quy đổi, tồn thấp, hiệu lực chứng nhận, ước tính giao.

const DAY_MS = 86_400_000;
export const LOW_STOCK = 10;
export const CERT_EXPIRING_DAYS = 30;

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayVn(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export interface Freshness {
  harvestedDaysAgo: number;
  daysLeft: number;
  tone: "good" | "warning" | "danger";
}

export function freshness(batch: Schema<"BatchFreshness"> | null | undefined, today: string): Freshness | null {
  if (!batch) return null;
  const daysLeft = daysBetween(today, batch.bestBefore);
  return {
    harvestedDaysAgo: Math.max(0, daysBetween(batch.harvestDate, today)),
    daysLeft,
    tone: daysLeft < 0 ? "danger" : daysLeft <= 2 ? "warning" : "good",
  };
}

export const harvestedText = (days: number) =>
  days === 0 ? "Thu hoạch hôm nay" : days === 1 ? "Thu hoạch hôm qua" : `Thu hoạch ${days} ngày trước`;

export const shelfLifeText = (days: number) =>
  days < 0 ? "Đã quá hạn sử dụng" : days === 0 ? "Hết hạn sử dụng hôm nay" : days > 60 ? `Hạn sử dụng còn ${Math.round(days / 30)} tháng` : `Còn ${days} ngày hạn sử dụng`;

/** Khối lượng (kg) trong đơn vị bán: "hộp 500g" → 0,5; "túi 1kg" → 1; "kg" → 1; không đọc được → null. */
export function unitWeightKg(saleUnit: string): number | null {
  const u = saleUnit.toLowerCase().replace(",", ".");
  if (/^\s*kg\s*$/.test(u)) return 1;
  const m = u.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "kg" ? n : n / 1000;
}

/** Giá quy đổi theo kg khi đơn vị bán không phải đúng 1 kg; null khi không cần hoặc không quy đổi được. */
export function pricePerKg(unitPrice: number, saleUnit: string): number | null {
  const kg = unitWeightKg(saleUnit);
  if (!kg || kg === 1) return null;
  return Math.round(unitPrice / kg / 1000) * 1000;
}

export function certValidity(cert: Pick<Schema<"Certification">, "valid" | "expiryDate">, today: string): CertValidity {
  if (!cert.valid) return "expired";
  return daysBetween(today, cert.expiryDate) <= CERT_EXPIRING_DAYS ? "expiring" : "valid";
}

/** Ước tính giao theo giờ chốt 16:00 [tạm — prototype, MVP đọc từ cấu hình]. */
export function deliveryEstimate(now: Date = new Date()): string {
  const hour = new Date(now.getTime() + 7 * 3_600_000).getUTCHours();
  return hour < 16 ? "Đặt trước 16:00 hôm nay, giao từ sáng mai" : "Đặt bây giờ, giao từ sáng ngày kia";
}

/** Gợi ý số ngày hạn sử dụng theo danh mục cấp 1 khi khai lô. */
export function suggestedShelfDays(rootCategoryName: string | undefined): number {
  const n = (rootCategoryName ?? "").toLowerCase();
  if (n.includes("trà") || n.includes("cà phê")) return 365;
  if (n.includes("rau") || n.includes("nấm")) return 5;
  if (n.includes("củ")) return 14;
  return 7;
}

/** Bậc giá sỉ áp dụng cho sản lượng; null khi chưa đạt bậc thấp nhất. */
export function wholesaleTier(offer: Schema<"WholesaleOffer">, quantity: number) {
  return [...offer.tiers].sort((a, b) => b.minQuantity - a.minQuantity).find((t) => quantity >= t.minQuantity) ?? null;
}

export interface QtyRule {
  min: number;
  step: number;
  /** Số chữ số thập phân được nhập */
  decimals: number;
  /** Bán theo cân: nhập số lẻ được */
  byWeight: boolean;
}

/** Quy tắc số lượng theo đơn vị bán: "kg" nhập lẻ tới 0,1 kg, nút −/+ bước 0,5; hộp, túi, gói… chỉ số nguyên. */
export function quantityRule(saleUnit: string): QtyRule {
  return saleUnit.trim().toLowerCase() === "kg"
    ? { min: 0.1, step: 0.5, decimals: 1, byWeight: true }
    : { min: 1, step: 1, decimals: 0, byWeight: false };
}

/** Đưa số nhập về hợp lệ: làm tròn theo quy tắc, kẹp trong [min, max]. `note` giải thích khi đã phải sửa. */
export function normalizeQty(raw: number, rule: QtyRule, max: number, unit: string): { qty: number; note: string | null } {
  const f = 10 ** rule.decimals;
  const cap = Math.floor(max * f) / f;
  if (!Number.isFinite(raw) || raw <= 0) return { qty: rule.min, note: "Số lượng phải lớn hơn 0." };
  let qty = Math.round(raw * f) / f;
  let note: string | null = qty !== raw ? (rule.byWeight ? "Đã làm tròn tới 0,1 kg." : `Sản phẩm bán theo ${unit}, nhập số nguyên.`) : null;
  if (qty < rule.min) {
    qty = rule.min;
    note = `Tối thiểu ${rule.min.toLocaleString("vi-VN")} ${unit}.`;
  }
  if (cap >= rule.min && qty > cap) {
    qty = cap;
    note = `Chỉ còn ${cap.toLocaleString("vi-VN")} ${unit}.`;
  }
  return { qty, note };
}

/** Đọc số lượng gõ tay: "1,5" và "1.5" đều là 1,5; có dấu phẩy thì dấu chấm là phân cách hàng nghìn. */
export function parseQtyInput(text: string): number {
  const t = text.trim().replace(/\s/g, "");
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
}

/** Số lượng mặc định khi mua: 1 đơn vị, hoặc phần còn lại nếu tồn ít hơn; null khi tồn dưới mức tối thiểu (không mua được). */
export function defaultQty(saleUnit: string, available: number): number | null {
  const rule = quantityRule(saleUnit);
  const f = 10 ** rule.decimals;
  const cap = Math.floor(available * f) / f;
  return cap < rule.min ? null : Math.min(1, cap);
}
