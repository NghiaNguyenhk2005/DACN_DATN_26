import { useEffect } from "react";
import type { AuthProvider } from "@refinedev/core";
import type { RoleCode, Schema } from "@farmery/contract";
import { api, clearSession, ME_KEY, redirectExpiredSession, TOKEN_KEY } from "../lib/api";
import { type ApiError, unwrap } from "../lib/problem";
import { isStaff } from "../lib/roles";

export type LoginVariables = { challengeId: string; code: string; totpCode?: string };

function readMe(): Schema<"Me"> | null {
  try {
    const raw = localStorage.getItem(ME_KEY);
    return raw ? (JSON.parse(raw) as Schema<"Me">) : null;
  } catch {
    return null;
  }
}

function expiresAt(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** Phiên có thể hết hạn khi người dùng đang để màn hình mở mà không gọi API. */
export function AdminSessionExpiry() {
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const check = () => {
      if (expiresAt(token) <= Date.now()) redirectExpiredSession(token);
    };
    const timeout = window.setTimeout(check, Math.max(0, expiresAt(token) - Date.now()));
    window.addEventListener("focus", check);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", check);
    };
  }, []);
  return null;
}

/** Vai trò của người đang đăng nhập, lưu lúc đăng nhập và làm mới mỗi lần gọi `GET /me`. */
export function currentRoles(): RoleCode[] {
  return readMe()?.roles ?? [];
}

export const authProvider: AuthProvider = {
  login: async ({ challengeId, code, totpCode }: LoginVariables) => {
    try {
      const { accessToken, user } = await unwrap(
        api.POST("/auth/login", { body: { challengeId, code, totpCode } }),
        "Mã OTP không đúng hoặc đã hết hạn.",
      );
      if (!isStaff(user.roles)) {
        return {
          success: false,
          error: { name: "Không có quyền", message: "Tài khoản này không có quyền vào ứng dụng nội bộ." },
        };
      }
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(ME_KEY, JSON.stringify(user));
      return { success: true, redirectTo: "/" };
    } catch (e) {
      const error = e as ApiError;
      return {
        success: false,
        error: { ...error, name: "Đăng nhập không thành công", message: error.message ?? "Đăng nhập không thành công." },
      };
    }
  },
  logout: async () => {
    clearSession();
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && expiresAt(token) > Date.now()) return { authenticated: true };
    clearSession();
    return { authenticated: false, logout: true, redirectTo: "/login" };
  },
  getIdentity: async () => {
    try {
      const me = await unwrap(api.GET("/me"), "Không đọc được thông tin tài khoản.");
      localStorage.setItem(ME_KEY, JSON.stringify(me));
      return { id: me.id, name: me.displayName, roles: me.roles };
    } catch {
      const me = readMe();
      return me ? { id: me.id, name: me.displayName, roles: me.roles } : null;
    }
  },
  getPermissions: async () => currentRoles(),
  onError: async (error) => {
    if (error?.statusCode === 401) {
      clearSession();
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },
};
