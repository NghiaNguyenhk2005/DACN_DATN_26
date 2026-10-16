import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createApiClient, type ApiClient, type Schema } from "@farmery/contract";
import { API_URL } from "@/lib/api";
import { NETWORK_MESSAGE, problemMessage, type ActionResult } from "@/lib/problem";
import { getSessionToken, loginHref } from "@/lib/session";
import { ApiUnavailableError, send, type Sent } from "./index";

// Lớp dữ liệu cần đăng nhập: token đọc từ cookie httpOnly, chỉ chạy phía máy chủ.

/** Client có gắn token của phiên hiện tại; null khi chưa đăng nhập. */
export async function authedClient(): Promise<ApiClient | null> {
  const token = await getSessionToken();
  return token ? createApiClient({ baseUrl: API_URL, getToken: () => token }) : null;
}

async function read<T>(call: (api: ApiClient) => Promise<Sent<T>>): Promise<T> {
  const api = await authedClient();
  if (!api) throw new ApiUnavailableError(401);
  const { data, response } = await send(() => call(api));
  if (data === undefined) throw new ApiUnavailableError(response.status);
  return data;
}

/** Người dùng của phiên hiện tại; null khi chưa đăng nhập hoặc token hết hạn. */
export const getViewer = cache(async (): Promise<Schema<"Me"> | null> => {
  const api = await authedClient();
  if (!api) return null;
  const { data, response } = await send(() => api.GET("/me"));
  if (data) return data;
  if (response.status === 401) return null;
  throw new ApiUnavailableError(response.status);
});

/** Trang cần đăng nhập: chưa đăng nhập thì chuyển /dang-nhap rồi quay lại `path`. */
export async function requireViewer(path: string): Promise<Schema<"Me">> {
  const viewer = await getViewer();
  if (!viewer) redirect(loginHref(path));
  return viewer;
}

export const getCart = cache((): Promise<Schema<"Cart">> => read((api) => api.GET("/cart")));

export const getAddresses = (): Promise<Schema<"Address">[]> => read((api) => api.GET("/me/addresses"));

/** Báo giá của giỏ hiện tại tới một địa chỉ; 422 (vd giỏ trống, ngoài vùng giao) trả câu báo lỗi. */
export async function getQuote(addressId: string): Promise<ActionResult<Schema<"CheckoutQuote">>> {
  const api = await authedClient();
  if (!api) throw new ApiUnavailableError(401);
  const { data, error, response } = await send(() => api.POST("/checkout/quote", { body: { addressId } }));
  if (data) return { ok: true, data };
  if (response.status === 422) {
    return { ok: false, message: problemMessage(error as Schema<"Problem">, 422, "Chưa tính được tiền cho đơn này.") };
  }
  throw new ApiUnavailableError(response.status);
}

/** Đơn kèm giờ của API lúc trả (header Date) để đồng hồ giữ chỗ không lệch theo máy người xem. */
export async function getOrder(orderId: string): Promise<{ order: Schema<"OrderDetail">; apiNow: number } | null> {
  const api = await authedClient();
  if (!api) throw new ApiUnavailableError(401);
  const { data, response } = await send(() => api.GET("/orders/{orderId}", { params: { path: { orderId } } }));
  if (data) return { order: data, apiNow: Date.parse(response.headers.get("date") ?? "") || Date.now() };
  if (response.status === 404 || response.status === 400) return null;
  throw new ApiUnavailableError(response.status);
}

/**
 * Thao tác ghi cho Server Action: lỗi trả về thành câu báo tiếng Việt thay vì ném.
 * Chưa đăng nhập hoặc token hết hạn trả `code: "UNAUTHENTICATED"` để action chuyển tới /dang-nhap.
 */
export async function mutate<T>(
  call: (api: ApiClient) => Promise<Sent<T>>,
  fallback: string,
  client?: ApiClient,
): Promise<ActionResult<T>> {
  const api = client ?? (await authedClient());
  if (!api) return { ok: false, code: "UNAUTHENTICATED", message: "Phiên đăng nhập đã hết hạn." };
  try {
    const { data, error, response } = await call(api);
    if (data !== undefined) return { ok: true, data };
    if (response.status === 401) return { ok: false, code: "UNAUTHENTICATED", message: "Phiên đăng nhập đã hết hạn." };
    const problem = error as Partial<Schema<"Problem">> | undefined;
    return { ok: false, code: problem?.code, message: problemMessage(problem, response.status, fallback) };
  } catch {
    return { ok: false, code: "NETWORK", message: NETWORK_MESSAGE };
  }
}

/** Thêm vào giỏ: PUT đặt số lượng tuyệt đối nên cộng với số đang có trong giỏ. */
export async function addToCartWith(
  listingId: string,
  quantity: number,
  client?: ApiClient,
): Promise<ActionResult<Schema<"Cart">>> {
  const cart = await mutate((api) => api.GET("/cart"), "Không đọc được giỏ hàng.", client);
  if (!cart.ok) return cart;
  const current = cart.data.items.find((i) => i.listingId === listingId)?.quantity ?? 0;
  return mutate(
    (api) => api.PUT("/cart/items/{listingId}", { params: { path: { listingId } }, body: { quantity: current + quantity } }),
    "Chưa thêm được sản phẩm vào giỏ.",
    client,
  );
}

/** Tên và số món trong giỏ cho đầu trang; lỗi API không làm hỏng đầu trang (coi như chưa đăng nhập). */
export async function getHeaderAccount(): Promise<{ displayName: string; cartCount: number } | null> {
  try {
    const viewer = await getViewer();
    if (!viewer) return null;
    const cart = viewer.roles.includes("buyer_retail") ? await getCart().catch(() => null) : null;
    return { displayName: viewer.displayName, cartCount: cart?.items.length ?? 0 };
  } catch {
    return null;
  }
}
