"use server";

import { randomUUID } from "node:crypto";
import type { Schema } from "@farmery/contract";
import type { ActionResult } from "@/lib/problem";
import { mutate } from "./account";

const ID = /^\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Gửi yêu cầu báo giá sỉ (POST /wholesale/quote-requests). Chưa đăng nhập trả `UNAUTHENTICATED` để form chuyển trang. */
export async function sendQuoteRequest(input: {
  productId: string;
  quantity: number;
  neededBy: string;
  note?: string;
}): Promise<ActionResult<Schema<"QuoteRequest">>> {
  if (!ID.test(input.productId) || !(input.quantity > 0) || !DATE.test(input.neededBy)) {
    return { ok: false, message: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại." };
  }
  const result = await mutate(
    (api) =>
      api.POST("/wholesale/quote-requests", {
        params: { header: { "Idempotency-Key": randomUUID() } },
        body: { productId: input.productId, quantity: input.quantity, neededBy: input.neededBy, note: input.note?.trim() || undefined },
      }),
    "Chưa gửi được yêu cầu báo giá. Vui lòng thử lại.",
  );
  if (!result.ok && result.code === "FORBIDDEN_ROLE") {
    return { ok: false, code: result.code, message: "Chỉ tài khoản doanh nghiệp mua sỉ đã xác minh mới gửi được yêu cầu báo giá." };
  }
  return result;
}
