"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Schema } from "@farmery/contract";
import type { ActionResult } from "@/lib/problem";
import { mutate, read } from "./account";

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
  revalidatePath("/khach-si");
  revalidatePath("/nha-cung-cap/bao-gia");
  return result;
}

/** Doanh nghiệp mua sỉ xem danh sách yêu cầu báo giá của mình (GET /wholesale/quote-requests). */
export async function getBuyerQuoteRequests(): Promise<Schema<"QuoteRequest">[]> {
  try {
    return await read((api) => api.GET("/wholesale/quote-requests"));
  } catch {
    return [];
  }
}

/** Doanh nghiệp mua sỉ phản hồi chấp nhận hoặc từ chối báo giá (POST /wholesale/quote-requests/:id/respond). */
export async function respondBuyerQuote(
  id: string,
  action: "accept" | "reject",
  rejectReason?: string,
): Promise<ActionResult<Schema<"QuoteRequest">>> {
  const result = await mutate(
    (api) =>
      api.POST("/wholesale/quote-requests/{id}/respond", {
        params: { path: { id } },
        body: { action, rejectReason: rejectReason?.trim() || undefined },
      }),
    "Chưa xử lý được phản hồi báo giá. Vui lòng thử lại.",
  );
  revalidatePath("/khach-si");
  revalidatePath("/nha-cung-cap/bao-gia");
  return result;
}

/** Yêu cầu gửi mã OTP để ký hợp đồng sỉ (POST /wholesale/quote-requests/:id/request-otp). */
export async function requestContractOtp(
  id: string,
): Promise<ActionResult<{ sent: boolean; message: string; devCode?: string }>> {
  return mutate(
    (api) => api.POST("/wholesale/quote-requests/{id}/request-otp", { params: { path: { id } } }),
    "Không thể gửi mã OTP. Vui lòng thử lại.",
  );
}

/** Nhập OTP để ký hợp đồng sỉ (POST /wholesale/quote-requests/:id/confirm-otp). */
export async function confirmContractOtp(
  id: string,
  code: string,
): Promise<ActionResult<Schema<"QuoteRequest">>> {
  const result = await mutate(
    (api) =>
      api.POST("/wholesale/quote-requests/{id}/confirm-otp", {
        params: { path: { id } },
        body: { code: code.trim() },
      }),
    "Mã OTP không đúng hoặc không thể ký hợp đồng.",
  );
  revalidatePath("/khach-si");
  revalidatePath("/nha-cung-cap/bao-gia");
  return result;
}

/** Thanh toán đơn sỉ qua PaymentService / DemoPaymentGateway (POST /wholesale/quote-requests/:id/pay). */
export async function payWholesaleOrder(id: string): Promise<ActionResult<Schema<"QuoteRequest">>> {
  const result = await mutate(
    (api) => api.POST("/wholesale/quote-requests/{id}/pay", { params: { path: { id } } }),
    "Chưa thanh toán được đơn hàng sỉ. Vui lòng thử lại.",
  );
  revalidatePath("/khach-si");
  revalidatePath("/nha-cung-cap/bao-gia");
  return result;
}

/** Nhà cung cấp gửi báo giá phản hồi 1 lượt (POST /seller/quote-requests/:id/quote). */
export async function sellerRespondQuote(
  id: string,
  input: { proposedPrice: number; proposedQty: number; proposedDelivery: string; note?: string },
): Promise<ActionResult<Schema<"QuoteRequest">>> {
  const result = await mutate(
    (api) =>
      api.POST("/seller/quote-requests/{id}/quote", {
        params: { path: { id } },
        body: {
          proposedPrice: input.proposedPrice,
          proposedQty: input.proposedQty,
          proposedDelivery: input.proposedDelivery,
          note: input.note?.trim() || undefined,
        },
      }),
    "Chưa gửi được báo giá phản hồi. Vui lòng thử lại.",
  );
  revalidatePath("/khach-si");
  revalidatePath("/nha-cung-cap/bao-gia");
  return result;
}
