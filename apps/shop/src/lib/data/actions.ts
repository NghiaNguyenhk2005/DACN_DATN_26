"use server";

import type { ProductQuery } from "@/lib/filters";
import { searchProducts, type ProductPage } from "./index";

/** "Xem thêm": trang kế tiếp theo nextCursor, gọi từ trình duyệt nhưng chạy phía máy chủ. */
export async function loadMoreProducts(query: ProductQuery, cursor: string): Promise<ProductPage> {
  return searchProducts({ ...query, cursor });
}
