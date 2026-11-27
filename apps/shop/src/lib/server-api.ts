import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createApiClient, type ApiClient } from "@farmery/contract";
import { API_URL } from "@/lib/api";

// API nhận IP từ shop khi cả hai dịch vụ đều nằm sau các tuyến proxy tin cậy.

/**
 * Số tầng proxy đứng TRƯỚC shop (nginx, load balancer) mà ta tin. X-Forwarded-For có dạng "khách, proxy1, proxy2":
 * mỗi proxy thêm IP của bên gọi vào cuối, nên chỉ phần thêm bởi proxy tin cậy mới đáng tin, phần đầu do khách tự khai.
 * Chỉ bật khi proxy được cấu hình thêm IP thật của bên gửi và cổng shop không thể bị truy cập trực tiếp.
 */
const configuredHops = Number(process.env.TRUSTED_PROXY_HOPS ?? "0");
const TRUSTED_PROXY_HOPS = Number.isSafeInteger(configuredHops) && configuredHops > 0 ? configuredHops : 0;

/** IP khách của yêu cầu đang xử lý, hoặc null khi không xác định được (dev không qua proxy, tiến trình nền). */
export async function getClientIp(): Promise<string | null> {
  if (TRUSTED_PROXY_HOPS === 0) return null;
  let incoming: Headers;
  try {
    incoming = await headers();
  } catch {
    return null; // ngoài phạm vi yêu cầu (vd chạy lúc build)
  }
  const chain = incoming.get("x-forwarded-for")?.split(",") ?? [];
  const candidate = chain.at(-TRUSTED_PROXY_HOPS)?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

/**
 * Client API cho code chạy trên máy chủ của shop; gắn token khi có và luôn chuyển IP khách để giới hạn tần suất
 * tính theo từng khách thay vì theo cả shop.
 */
export function createServerClient(token?: string | null): ApiClient {
  const client = createApiClient(token ? { baseUrl: API_URL, getToken: () => token } : { baseUrl: API_URL });
  client.use({
    async onRequest({ request }) {
      const ip = await getClientIp();
      if (ip) request.headers.set("X-Forwarded-For", ip);
      return request;
    },
  });
  return client;
}
