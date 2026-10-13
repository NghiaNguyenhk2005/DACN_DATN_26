import { createApiClient } from "@farmery/contract";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const api = createApiClient({ baseUrl: API_URL });
