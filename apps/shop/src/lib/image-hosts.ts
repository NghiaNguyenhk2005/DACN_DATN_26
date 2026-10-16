// Host ảnh của dữ liệu demo (packages/mock-data); next.config.ts và SafeImage dùng chung danh sách này.
export const IMAGE_HOSTS = [
  "atisodalat.vn",
  "cdn0322.cdn4s.com",
  "dacsandalat.com.vn",
  "dalatberries.com",
  "encrypted-tbn0.gstatic.com",
  "goccualien.com",
  "hanaagri.vn",
  "hongdalat.com",
  "i.ex-cdn.com",
  "icdn.dantri.com.vn",
  "images.unsplash.com",
  "k-gardennongsandalat.com",
  "namxanh.vn",
  "nongid.vn",
  "scontent.fsgn2-8.fna.fbcdn.net",
  "trucvufarm.com.vn",
  "vnn.1cdn.vn",
] as const;

export function isAllowedImageHost(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && (IMAGE_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}
