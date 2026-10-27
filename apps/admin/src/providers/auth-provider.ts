import type { AuthProvider } from "@refinedev/core";
import type { RoleCode, Schema } from "@farmery/contract";
import { api, TOKEN_KEY } from "../lib/api";
import { unwrap } from "../lib/problem";
import { isStaff } from "../lib/roles";

const ME_KEY = "farmery-admin-me";

export type LoginVariables = { challengeId: string; code: string };

function readMe(): Schema<"Me"> | null {
  try {
    const raw = localStorage.getItem(ME_KEY);
    return raw ? (JSON.parse(raw) as Schema<"Me">) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ME_KEY);
}

/** Vai trò của người đang đăng nhập, lưu lúc đăng nhập và làm mới mỗi lần gọi `GET /me`. */
export function currentRoles(): RoleCode[] {
  return readMe()?.roles ?? [];
}

export const authProvider: AuthProvider = {
  login: async ({ challengeId, code }: LoginVariables) => {
    try {
      const { accessToken, user } = await unwrap(
        api.POST("/auth/login", { body: { challengeId, code } }),
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
      const message = (e as { message?: string }).message ?? "Đăng nhập không thành công.";
      return { success: false, error: { name: "Đăng nhập không thành công", message } };
    }
  },
  logout: async () => {
    clearSession();
    return { success: true, redirectTo: "/login" };
  },
  check: async () =>
    localStorage.getItem(TOKEN_KEY)
      ? { authenticated: true }
      : { authenticated: false, logout: true, redirectTo: "/login" },
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
