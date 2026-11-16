import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma CLI không tự đọc .env ở bản 7: nạp cùng quy tắc với main.ts (biến đã đặt ưu tiên hơn .env).
if (existsSync(".env")) process.loadEnvFile(".env");

// Mặc định trỏ PostgreSQL của docker-compose để generate/validate không cần cấu hình; môi trường khác phải đặt DATABASE_URL.
const LOCAL_URL = "postgresql://farmery:farmery@localhost:5433/farmery";

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? LOCAL_URL },
});
