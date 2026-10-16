// Hợp đồng không có slug: đường dẫn dạng "ten-khong-dau-<id>", chỉ số id ở cuối có nghĩa.
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toSlugId(name: string, id: string): string {
  const s = slugify(name);
  return s ? `${s}-${id}` : id;
}

export function parseSlugId(slug: string): string | null {
  return /(?:^|-)(\d+)$/.exec(slug)?.[1] ?? null;
}

export const productHref = (p: { id: string; name: string }) => `/san-pham/${toSlugId(p.name, p.id)}`;
export const categoryHref = (c: { id: string; name: string }) => `/danh-muc/${toSlugId(c.name, c.id)}`;
export const traceHref = (traceCode: string) => `/truy-xuat/${encodeURIComponent(traceCode)}`;
