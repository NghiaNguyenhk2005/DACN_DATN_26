export interface AppConfig {
  port: number;
  corsOrigins: string[];
  demoMode: boolean;
  jwtSecret: string;
  validateResponses: boolean;
}

export const APP_CONFIG = Symbol("APP_CONFIG");

function flag(value: string | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value === "true";
}

// Đọc biến môi trường lúc khởi động; danh sách biến ở apps/api/.env.example.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env.NODE_ENV === "production";
  const jwtSecret = env.JWT_SECRET || (production ? undefined : "dev-only-secret");
  if (!jwtSecret) throw new Error("Thiếu JWT_SECRET khi NODE_ENV=production");
  return {
    port: Number(env.PORT ?? 4000),
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173").split(","),
    demoMode: flag(env.DEMO_MODE, !production),
    jwtSecret,
    validateResponses: flag(env.VALIDATE_RESPONSES, !production),
  };
}
