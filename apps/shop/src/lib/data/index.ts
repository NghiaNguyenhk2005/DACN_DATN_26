import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createApiClient, type Schema } from "@farmery/contract";
import { API_URL } from "@/lib/api";
import type { ProductQuery } from "@/lib/filters";

// Lớp dữ liệu cho Server Components: mọi trang công khai gọi API qua đây, không gọi thẳng client.
const api = createApiClient({ baseUrl: API_URL });

export class ApiUnavailableError extends Error {
  constructor(
    readonly status: number | null,
    options?: ErrorOptions,
  ) {
    super(status ? `API trả mã ${status}` : "Không kết nối được API", options);
    this.name = "ApiUnavailableError";
  }
}

type Sent<T> = { data?: T; response: Response };

async function send<T>(call: () => Promise<Sent<T>>): Promise<Sent<T>> {
  // Dựng theo từng request: không dựng tĩnh lúc build, trạng thái thu hồi có hiệu lực ngay.
  await connection();
  try {
    return await call();
  } catch (cause) {
    throw new ApiUnavailableError(null, { cause });
  }
}

async function required<T>(call: () => Promise<Sent<T>>): Promise<T> {
  const { data, response } = await send(call);
  if (data === undefined) throw new ApiUnavailableError(response.status);
  return data;
}

async function optional<T>(call: () => Promise<Sent<T>>): Promise<T | null> {
  const { data, response } = await send(call);
  if (data !== undefined) return data;
  // 400 ở đây là tham số đường dẫn sai định dạng (vd mã truy xuất quá ngắn) — coi như không tồn tại.
  if (response.status === 404 || response.status === 400) return null;
  throw new ApiUnavailableError(response.status);
}

export type ProductPage = { items: Schema<"ProductCard">[]; nextCursor: string | null };

// Layout và trang danh mục cùng cần cây danh mục: gộp thành một lần gọi trong mỗi request.
export const getCategories = cache((): Promise<Schema<"Category">[]> => required(() => api.GET("/categories")));

export const searchProducts = (query: ProductQuery): Promise<ProductPage> =>
  required(() => api.GET("/products", { params: { query } }));

export const getProduct = (productId: string): Promise<Schema<"ProductDetail"> | null> =>
  optional(() => api.GET("/products/{productId}", { params: { path: { productId } } }));

export const getTrace = (traceCode: string): Promise<Schema<"TraceView"> | null> =>
  optional(() => api.GET("/public/trace/{traceCode}", { params: { path: { traceCode } } }));

export const getSupplier = (supplierId: string): Promise<Schema<"SupplierProfile"> | null> =>
  optional(() => api.GET("/suppliers/{supplierId}", { params: { path: { supplierId } } }));
