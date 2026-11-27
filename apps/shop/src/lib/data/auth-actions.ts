"use server";

import { redirect } from "next/navigation";
import type { Schema } from "@farmery/contract";
import { NETWORK_MESSAGE, problemMessage, retryAfterSeconds } from "@/lib/problem";
import { createServerClient } from "@/lib/server-api";
import { clearSession, parsePendingAdd, safeNext, setSession } from "@/lib/session";
import { addToCartWith } from "./account";

export type SentOtp = {
  status: "sent";
  email: string;
  challengeId: string;
  expiresAt: string;
  devCode?: string;
  /**
   * Lần gửi lại vừa rồi không thành (vd bị giới hạn tần suất): vẫn ở bước nhập mã với phiên mã cũ.
   * `retryAfter` là số giây phải chờ theo Retry-After; `nonce` đổi mỗi lần để giao diện đếm ngược lại từ đầu.
   */
  resend?: { message: string; retryAfter?: number; nonce: number };
};

export type OtpState =
  | { status: "idle" }
  | { status: "error"; email: string; message: string; retryAfter?: number }
  | SentOtp;

/**
 * Kết quả xác nhận mã. `code` giữ mã lỗi của API: OTP_EXPIRED (hết hạn, sai quá 5 lần) để hiện nút "Gửi mã mới",
 * RATE_LIMITED (bị tạm khóa) kèm `retryAfter` để đếm ngược.
 */
export type VerifyState = { message: string; code?: string; retryAfter?: number; nonce: number; registering?: boolean } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failed(prev: OtpState, email: string, message: string, retryAfter?: number): OtpState {
  // Gửi lại từ bước nhập mã: giữ nguyên phiên mã cũ để người dùng vẫn nhập tiếp được, chỉ kèm thông báo.
  if (prev.status === "sent" && prev.email === email) {
    return { ...prev, resend: { message, ...(retryAfter ? { retryAfter } : {}), nonce: Date.now() } };
  }
  return { status: "error", email, message, ...(retryAfter ? { retryAfter } : {}) };
}

/** Bước 1: gửi mã OTP tới email. Cũng dùng cho "Gửi lại mã" ở bước 2. */
export async function requestOtp(prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) return { status: "error", email, message: "Email chưa đúng định dạng." };
  try {
    const { data, error, response } = await createServerClient().POST("/auth/otp", { body: { email } });
    if (data) return { status: "sent", email, ...data };

    const problem = error as Schema<"Problem"> | undefined;
    if (response.status === 429) {
      // API nói rõ là vừa gửi hay đã quá số mã mỗi giờ ở `detail`.
      const message = problem?.detail ?? problemMessage(problem, 429, "Bạn thao tác quá nhanh.");
      return failed(prev, email, message, retryAfterSeconds(response));
    }
    const message =
      response.status === 404
        ? "Email này chưa có tài khoản Farmery."
        : problemMessage(problem, response.status, "Chưa gửi được mã. Vui lòng thử lại.");
    return failed(prev, email, message);
  } catch {
    return failed(prev, email, NETWORK_MESSAGE);
  }
}

/** Bước 2: xác nhận OTP → đặt cookie phiên → (thêm món đang chờ vào giỏ) → quay lại trang trước. */
export async function verifyOtp(_prev: VerifyState, formData: FormData): Promise<NonNullable<VerifyState>> {
  const challengeId = String(formData.get("challengeId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const registering = formData.has("displayName");
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { message: "Mã OTP gồm 6 chữ số.", nonce: Date.now(), registering };
  if (registering && (!displayName || displayName.length > 120)) {
    return { message: "Nhập họ tên từ 1 đến 120 ký tự.", nonce: Date.now(), registering };
  }

  let destination = safeNext(formData.get("next"));
  try {
    const client = createServerClient();
    const { data, error, response } = registering
      ? await client.POST("/auth/register", { body: { challengeId, code, displayName } })
      : await client.POST("/auth/login", { body: { challengeId, code } });
    if (!data) {
      const problem = error as Schema<"Problem"> | undefined;
      if (problem?.code === "REGISTRATION_REQUIRED") {
        return { message: "", code: problem.code, registering: true, nonce: Date.now() };
      }
      if (response.status === 429) {
        return {
          message: problem?.detail ?? "Nhập sai quá nhiều lần, tạm khóa đăng nhập.",
          code: "RATE_LIMITED",
          retryAfter: retryAfterSeconds(response),
          nonce: Date.now(),
          registering,
        };
      }
      const fallback =
        response.status === 401 ? "Mã OTP không đúng hoặc đã hết hạn." : "Chưa đăng nhập được. Vui lòng thử lại.";
      // OTP_EXPIRED gộp cả "hết hạn" lẫn "sai quá 5 lần": lấy câu của API để nói đúng nguyên nhân.
      const message =
        problem?.code === "OTP_EXPIRED" && problem.detail ? problem.detail : problemMessage(problem, response.status, fallback);
      return {
        message,
        ...(problem?.code ? { code: problem.code } : {}),
        nonce: Date.now(),
        registering: registering && problem?.code !== "REGISTRATION_UNAVAILABLE",
      };
    }
    await setSession(data.accessToken);

    const pending = parsePendingAdd(formData.get("them"));
    if (pending && data.user.roles.includes("buyer_retail")) {
      const client = createServerClient(data.accessToken);
      const added = await addToCartWith(pending.listingId, pending.quantity, client);
      if (!added.ok) destination = `/gio-hang?loi=${encodeURIComponent(added.code ?? "THEM_VAO_GIO")}`;
    }
  } catch {
    return { message: NETWORK_MESSAGE, nonce: Date.now(), registering };
  }
  redirect(destination);
}

export async function logout() {
  await clearSession();
  redirect("/");
}
