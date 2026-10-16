import { cookies, headers } from "next/headers";

// JWT của API giữ trong cookie httpOnly: chỉ phía máy chủ (lớp dữ liệu, Server Action, proxy.ts) đọc được.
export const SESSION_COOKIE = "farmery_token";
const MAX_AGE = 8 * 60 * 60; // khớp hạn JWT của API

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Chỉ gọi trong Server Action hoặc Route Handler. */
export async function setSession(token: string) {
  // Secure theo giao thức thật của trang: demo trên điện thoại qua http://<IP LAN> vẫn giữ được cookie.
  const origin = (await headers()).get("origin") ?? "";
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Chỉ gọi trong Server Action hoặc Route Handler. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Đường dẫn trong ứng dụng an toàn để quay lại sau đăng nhập; còn lại về trang chủ. */
export function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** "/dang-nhap?next=…[&them=<listingId>:<số lượng>]" — `them` là món chờ thêm vào giỏ sau khi đăng nhập. */
export function loginHref(next: string, pendingAdd?: { listingId: string; quantity: number }) {
  const params = new URLSearchParams({ next: safeNext(next) });
  if (pendingAdd) params.set("them", `${pendingAdd.listingId}:${pendingAdd.quantity}`);
  return `/dang-nhap?${params}`;
}

export function parsePendingAdd(value: unknown): { listingId: string; quantity: number } | null {
  const m = typeof value === "string" ? /^(\d+):(\d+(?:\.\d+)?)$/.exec(value) : null;
  if (!m) return null;
  const quantity = Number(m[2]);
  return quantity > 0 ? { listingId: m[1], quantity } : null;
}
