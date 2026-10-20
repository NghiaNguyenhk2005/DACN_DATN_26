import "server-only";
import { cache } from "react";
import type { Schema } from "@farmery/contract";
import { authedClient, read } from "./account";
import { ApiUnavailableError, send } from "./index";

// Lớp dữ liệu của khu nhà cung cấp: mọi lời gọi /seller/* mang token của phiên, lỗi API không đổi thành dữ liệu giả.

export type SellerBatchFilter = { productId?: string; status?: Schema<"ReviewStatus"> };

export const getSellerProducts = cache(
  (): Promise<Schema<"SellerProduct">[]> => read((api) => api.GET("/seller/products")),
);

export const getSellerBatches = (filter: SellerBatchFilter = {}): Promise<Schema<"Batch">[]> =>
  read((api) => api.GET("/seller/batches", { params: { query: filter } }));

/** Lô của nhà cung cấp đang đăng nhập; null khi không có (404) hoặc mã sai định dạng (400). */
export async function getSellerBatch(batchId: string): Promise<Schema<"Batch"> | null> {
  const api = await authedClient();
  if (!api) throw new ApiUnavailableError(401);
  const { data, response } = await send(() => api.GET("/seller/batches/{batchId}", { params: { path: { batchId } } }));
  if (data) return data;
  if (response.status === 404 || response.status === 400) return null;
  throw new ApiUnavailableError(response.status);
}

export const getSellerBatchLogs = (batchId: string): Promise<Schema<"FarmingLog">[]> =>
  read((api) => api.GET("/seller/batches/{batchId}/logs", { params: { path: { batchId } } }));
