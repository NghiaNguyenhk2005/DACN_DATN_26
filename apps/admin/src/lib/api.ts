import { createApiClient } from "@farmery/contract";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const TOKEN_KEY = "farmery-admin-token";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: () => localStorage.getItem(TOKEN_KEY),
});
