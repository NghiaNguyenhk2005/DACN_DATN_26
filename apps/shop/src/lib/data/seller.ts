import "server-only";
import { cache } from "react";
import type { Schema } from "@farmery/contract";
import { api } from "@/lib/api";
import { authedClient } from "@/lib/data/account";
import { send } from "@/lib/data/index";

/**
 * Lớp dữ liệu dành riêng cho Khu nhà cung cấp trong apps/shop (Server Components).
 */

// Dữ liệu fallback dự phòng cho sản phẩm khi API chưa sẵn sàng hoặc lỗi kết nối
const FALLBACK_PRODUCTS: Schema<"SellerProduct">[] = [
  {
    id: "1",
    name: "Dâu tây Hana giống Nhật Bản",
    categoryId: "1",
    unit: "hộp 500g",
    status: "approved",
    imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    name: "Cà chua cherry vàng Lạc Dương",
    categoryId: "1",
    unit: "hộp 500g",
    status: "approved",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    name: "Rau xà lách mỡ thủy canh",
    categoryId: "2",
    unit: "túi 300g",
    status: "approved",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
  },
];

// Dữ liệu fallback dự phòng cho các lô hàng
const FALLBACK_BATCHES: Schema<"Batch">[] = [
  {
    id: "7001",
    batchCode: "DTDL-2610-01",
    productId: "1",
    productName: "Dâu tây Hana giống Nhật Bản",
    harvestDate: "2026-10-15",
    bestBefore: "2026-10-22",
    declaredQuantity: 250,
    status: "approved",
    rejectReason: null,
    traceCode: "TRC-2610-01",
    traceUrl: "/truy-xuat/TRC-2610-01",
    recalledAt: null,
    createdAt: "2026-10-15T08:00:00.000Z",
  },
  {
    id: "7002",
    batchCode: "CC-2610-02",
    productId: "2",
    productName: "Cà chua cherry vàng Lạc Dương",
    harvestDate: "2026-10-17",
    bestBefore: "2026-10-27",
    declaredQuantity: 180,
    status: "pending_review",
    rejectReason: null,
    traceCode: null,
    traceUrl: null,
    recalledAt: null,
    createdAt: "2026-10-17T09:30:00.000Z",
  },
  {
    id: "7003",
    batchCode: "XL-2610-03",
    productId: "3",
    productName: "Rau xà lách mỡ thủy canh",
    harvestDate: "2026-10-10",
    bestBefore: "2026-10-16",
    declaredQuantity: 100,
    status: "rejected",
    rejectReason: "Chỉ số dư lượng bảo vệ thực vật test nhanh chưa đạt chuẩn VietGAP.",
    traceCode: null,
    traceUrl: null,
    recalledAt: null,
    createdAt: "2026-10-10T14:15:00.000Z",
  },
];

async function getClient() {
  const authed = await authedClient();
  return authed ?? api;
}

/** Lấy danh sách sản phẩm đã duyệt của nhà cung cấp để khai báo lô */
export const getSellerProducts = cache(async (): Promise<Schema<"SellerProduct">[]> => {
  try {
    const client = await getClient();
    const { data } = await send(() => client.GET("/seller/products"));
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    return FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
});

/** Lấy danh sách các lô hàng của nhà cung cấp */
export const getSellerBatches = cache(
  async (filter?: {
    productId?: string;
    status?: Schema<"ReviewStatus">;
  }): Promise<Schema<"Batch">[]> => {
    try {
      const client = await getClient();
      const queryParams: Record<string, string> = {};
      if (filter?.productId) queryParams.productId = filter.productId;
      if (filter?.status) queryParams.status = filter.status;

      const { data } = await send(() =>
        client.GET("/seller/batches", {
          params: {
            query: queryParams as { productId?: string; status?: Schema<"ReviewStatus"> },
          },
        }),
      );

      if (data && Array.isArray(data)) {
        return data;
      }
      return filterBatches(FALLBACK_BATCHES, filter);
    } catch {
      return filterBatches(FALLBACK_BATCHES, filter);
    }
  },
);

function filterBatches(
  batches: Schema<"Batch">[],
  filter?: { productId?: string; status?: Schema<"ReviewStatus"> },
): Schema<"Batch">[] {
  let res = [...batches];
  if (filter?.productId) {
    res = res.filter((b) => b.productId === filter.productId);
  }
  if (filter?.status) {
    res = res.filter((b) => b.status === filter.status);
  }
  return res;
}

/** Lấy chi tiết một lô hàng */
export async function getSellerBatch(batchId: string): Promise<Schema<"Batch"> | null> {
  try {
    const client = await getClient();
    const { data, response } = await send(() =>
      client.GET("/seller/batches/{batchId}", {
        params: { path: { batchId } },
      }),
    );
    if (data) return data;
    if (response?.status === 404) return null;
    return FALLBACK_BATCHES.find((b) => b.id === batchId) ?? null;
  } catch {
    return FALLBACK_BATCHES.find((b) => b.id === batchId) ?? null;
  }
}

/** Lấy nhật ký canh tác của một lô */
export async function getSellerBatchLogs(batchId: string): Promise<Schema<"FarmingLog">[]> {
  try {
    const client = await getClient();
    const { data } = await send(() =>
      client.GET("/seller/batches/{batchId}/logs", {
        params: { path: { batchId } },
      }),
    );
    if (data && Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}
