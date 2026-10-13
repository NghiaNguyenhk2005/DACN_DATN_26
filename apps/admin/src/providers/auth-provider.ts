import type { AuthProvider } from "@refinedev/core";
import { TOKEN_KEY } from "../lib/api";

// Stub: nhận mọi thông tin đăng nhập. Thay bằng POST /auth/otp + /auth/login, vai trò lấy từ GET /me.
export const authProvider: AuthProvider = {
  login: async () => {
    localStorage.setItem(TOKEN_KEY, "dev");
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return { success: true, redirectTo: "/login" };
  },
  check: async () =>
    localStorage.getItem(TOKEN_KEY)
      ? { authenticated: true }
      : { authenticated: false, redirectTo: "/login" },
  getIdentity: async () => ({ id: "0", name: "Nhân viên (giả lập)" }),
  onError: async (error) => (error?.statusCode === 401 ? { logout: true } : {}),
};
