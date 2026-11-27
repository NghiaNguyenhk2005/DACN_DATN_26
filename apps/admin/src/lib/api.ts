import { createApiClient } from "@farmery/contract";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const TOKEN_KEY = "farmery-admin-token";
export const ME_KEY = "farmery-admin-me";

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ME_KEY);
}

export function redirectExpiredSession(expectedToken: string) {
  if (localStorage.getItem(TOKEN_KEY) !== expectedToken) return;
  clearSession();
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: () => localStorage.getItem(TOKEN_KEY),
});

api.use({
  onResponse({ request, response }) {
    const token = request.headers.get("Authorization");
    // OTP errors return 401 too. Only invalidate a session rejected on an authenticated endpoint.
    if (response.status === 401 && token?.startsWith("Bearer ") && !new URL(request.url).pathname.includes("/auth/")) {
      redirectExpiredSession(token.slice(7));
    }
  },
});
