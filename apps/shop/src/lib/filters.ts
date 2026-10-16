import type { paths, Schema } from "@farmery/contract";
import { CERT_LABELS } from "@/lib/labels";
import { formatVnd } from "@/lib/format";

export type ProductQuery = NonNullable<paths["/products"]["get"]["parameters"]["query"]>;
type CertType = Schema<"CertType">;

export const CERT_OPTIONS = Object.keys(CERT_LABELS) as CertType[];

// Hợp đồng chưa có danh sách vùng trồng; API khớp `region` kiểu chứa chuỗi, bỏ dấu với growingRegion.
export const REGION_OPTIONS = ["Đà Lạt", "Đơn Dương", "Lạc Dương", "Đức Trọng"];

/** Bộ lọc đọc từ URL; tên tham số trùng tên tham số của GET /products. */
export interface Filters {
  cert?: CertType;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  inSeason?: boolean;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const toPrice = (v: string | undefined) => {
  if (!v || !/^\d+$/.test(v)) return undefined;
  return Number(v);
};

export function parseQ(sp: RawSearchParams): string | undefined {
  return first(sp.q);
}

export function parseFilters(sp: RawSearchParams): Filters {
  const cert = first(sp.cert);
  return {
    cert: CERT_OPTIONS.includes(cert as CertType) ? (cert as CertType) : undefined,
    region: first(sp.region),
    minPrice: toPrice(first(sp.minPrice)),
    maxPrice: toPrice(first(sp.maxPrice)),
    inStock: first(sp.inStock) === "true" || undefined,
    inSeason: first(sp.inSeason) === "true" || undefined,
  };
}

export function filtersToSearch(q: string | undefined, f: Filters): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (f.cert) p.set("cert", f.cert);
  if (f.region) p.set("region", f.region);
  if (f.minPrice !== undefined) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice !== undefined) p.set("maxPrice", String(f.maxPrice));
  if (f.inStock) p.set("inStock", "true");
  if (f.inSeason) p.set("inSeason", "true");
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Số bộ lọc đang áp dụng trong ngăn kéo (khoảng giá tính là một). */
export function countFilters(f: Filters): number {
  return (f.cert ? 1 : 0) + (f.region ? 1 : 0) + (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0);
}

export interface AppliedFilter {
  key: keyof Filters | "price";
  label: string;
  without: Filters;
}

/** Danh sách chip "đã áp dụng", mỗi chip kèm bộ lọc còn lại khi bỏ chip đó. */
export function appliedFilters(f: Filters): AppliedFilter[] {
  const out: AppliedFilter[] = [];
  if (f.cert) out.push({ key: "cert", label: CERT_LABELS[f.cert], without: { ...f, cert: undefined } });
  if (f.region) out.push({ key: "region", label: f.region, without: { ...f, region: undefined } });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    const label =
      f.minPrice !== undefined && f.maxPrice !== undefined
        ? `${formatVnd(f.minPrice)} – ${formatVnd(f.maxPrice)}`
        : f.minPrice !== undefined
          ? `Từ ${formatVnd(f.minPrice)}`
          : `Đến ${formatVnd(f.maxPrice!)}`;
    out.push({ key: "price", label, without: { ...f, minPrice: undefined, maxPrice: undefined } });
  }
  if (f.inStock) out.push({ key: "inStock", label: "Còn hàng", without: { ...f, inStock: undefined } });
  if (f.inSeason) out.push({ key: "inSeason", label: "Đang vào mùa", without: { ...f, inSeason: undefined } });
  return out;
}

export function toProductQuery(q: string | undefined, f: Filters, extra: Partial<ProductQuery> = {}): ProductQuery {
  const query: ProductQuery = { ...extra };
  if (q) query.q = q;
  if (f.cert) query.cert = f.cert;
  if (f.region) query.region = f.region;
  if (f.minPrice !== undefined) query.minPrice = f.minPrice;
  if (f.maxPrice !== undefined) query.maxPrice = f.maxPrice;
  if (f.inStock) query.inStock = true;
  if (f.inSeason) query.inSeason = true;
  return query;
}
