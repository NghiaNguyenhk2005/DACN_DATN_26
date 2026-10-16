"use server";

import { redirect } from "next/navigation";
import { createApiClient, type Schema } from "@farmery/contract";
import { api, API_URL } from "@/lib/api";
import { NETWORK_MESSAGE, problemMessage } from "@/lib/problem";
import { clearSession, parsePendingAdd, safeNext, setSession } from "@/lib/session";
import { addToCartWith } from "./account";

export type OtpState =
  | { status: "idle" }
  | { status: "error"; email: string; message: string }
  | { status: "sent"; email: string; challengeId: string; expiresAt: string; devCode?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bước 1: gửi mã OTP tới email. */
export async function requestOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) return { status: "error", email, message: "Email chưa đúng định dạng." };
  try {
    const { data, error, response } = await api.POST("/auth/otp", { body: { email } });
    if (data) return { status: "sent", email, ...data };
    const message =
      response.status === 404
        ? "Email này chưa có tài khoản Farmery."
        : problemMessage(error as Schema<"Problem">, response.status, "Chưa gửi được mã. Vui lòng thử lại.");
    return { status: "error", email, message };
  } catch {
    return { status: "error", email, message: NETWORK_MESSAGE };
  }
}

/** Bước 2: xác nhận OTP → đặt cookie phiên → (thêm món đang chờ vào giỏ) → quay lại trang trước. */
export async function verifyOtp(_prev: { message: string } | null, formData: FormData): Promise<{ message: string }> {
  const challengeId = String(formData.get("challengeId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { message: "Mã OTP gồm 6 chữ số." };

  let destination = safeNext(formData.get("next"));
  try {
    const { data, error, response } = await api.POST("/auth/login", { body: { challengeId, code } });
    if (!data) {
      if (response.status === 401) return { message: "Mã OTP không đúng hoặc đã hết hạn." };
      return { message: problemMessage(error as Schema<"Problem">, response.status, "Chưa đăng nhập được. Vui lòng thử lại.") };
    }
    await setSession(data.accessToken);

    const pending = parsePendingAdd(formData.get("them"));
    if (pending && data.user.roles.includes("buyer_retail")) {
      const client = createApiClient({ baseUrl: API_URL, getToken: () => data.accessToken });
      const added = await addToCartWith(pending.listingId, pending.quantity, client);
      if (!added.ok) destination = `/gio-hang?loi=${encodeURIComponent(added.code ?? "THEM_VAO_GIO")}`;
    }
  } catch {
    return { message: NETWORK_MESSAGE };
  }
  redirect(destination);
}

export async function logout() {
  await clearSession();
  redirect("/");
}
