import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";

export type { components, operations, paths } from "./generated/schema";

export type Schema<K extends keyof components["schemas"]> = components["schemas"][K];

export type OrderStatus = Schema<"OrderStatus">;
export type RoleCode = Schema<"RoleCode">;
export type Problem = Schema<"Problem">;

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl });
  if (getToken) {
    client.use({
      onRequest({ request }) {
        const token = getToken();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    });
  }
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
