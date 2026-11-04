export interface SmtpConfig {
  url: string;
  from: string;
}

export interface AppConfig {
  production: boolean;
  port: number;
  corsOrigins: string[];
  demoMode: boolean;
  jwtSecret: string;
  validateResponses: boolean;
  /** Swagger UI ở /docs; mặc định tắt khi production. */
  docsEnabled: boolean;
  /** Số tầng proxy tin cậy để lấy IP thật từ X-Forwarded-For; 0 là không có proxy. */
  trustProxy: number;
  rateLimit: { enabled: boolean; windowMs: number; max: number; authMax: number };
  otp: { resendCooldownSeconds: number; maxPerHour: number; maxFailuresPer15Min: number };
  /** null thì OTP không gửi thật (chỉ hợp lệ ở DEMO_MODE). */
  smtp: SmtpConfig | null;
  accessLog: boolean;
}

export const APP_CONFIG = Symbol("APP_CONFIG");

const MIN_PRODUCTION_SECRET = 32;

function flag(env: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean {
  const value = env[name];
  if (value === undefined || value === "") return fallback;
  if (value !== "true" && value !== "false") throw new Error(`${name} phải là true hoặc false`);
  return value === "true";
}

function int(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} phải là số nguyên trong khoảng ${min}..${max}`);
  return n;
}

// Đọc biến môi trường lúc khởi động và từ chối cấu hình nguy hiểm; danh sách biến ở apps/api/.env.example.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env.NODE_ENV === "production";

  const jwtSecret = env.JWT_SECRET || (production ? undefined : "dev-only-secret");
  if (!jwtSecret) throw new Error("Thiếu JWT_SECRET khi NODE_ENV=production");
  if (production && jwtSecret.length < MIN_PRODUCTION_SECRET) {
    throw new Error(`JWT_SECRET phải dài ít nhất ${MIN_PRODUCTION_SECRET} ký tự khi NODE_ENV=production`);
  }

  const corsOrigins = (env.CORS_ORIGINS ?? (production ? "" : "http://localhost:3000,http://localhost:5173"))
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins.includes("*")) throw new Error("CORS_ORIGINS không được dùng dấu *, hãy liệt kê từng nguồn");

  const demoMode = flag(env, "DEMO_MODE", !production);
  const smtpUrl = env.SMTP_URL?.trim();
  const smtp = smtpUrl ? { url: smtpUrl, from: env.SMTP_FROM?.trim() || "Farmery <no-reply@farmery.local>" } : null;
  if (!demoMode && !smtp) throw new Error("Thiếu SMTP_URL: ngoài DEMO_MODE, OTP phải gửi qua email thật");

  return {
    production,
    port: int(env, "PORT", 4000, 1, 65535),
    corsOrigins,
    demoMode,
    jwtSecret,
    validateResponses: flag(env, "VALIDATE_RESPONSES", !production),
    docsEnabled: flag(env, "DOCS_ENABLED", !production),
    trustProxy: int(env, "TRUST_PROXY", 0, 0, 10),
    rateLimit: {
      enabled: flag(env, "RATE_LIMIT_ENABLED", true),
      windowMs: int(env, "RATE_LIMIT_WINDOW_SECONDS", 60, 1, 3600) * 1000,
      max: int(env, "RATE_LIMIT_MAX", 600, 1, 1_000_000),
      authMax: int(env, "RATE_LIMIT_AUTH_MAX", 30, 1, 1_000_000),
    },
    // Ở DEMO_MODE nới lỏng để chạy thử/e2e liên tục; ngoài DEMO_MODE áp mức chặt (đều chỉnh được bằng biến môi trường).
    otp: {
      resendCooldownSeconds: int(env, "OTP_RESEND_COOLDOWN_SECONDS", demoMode ? 0 : 30, 0, 3600),
      maxPerHour: int(env, "OTP_MAX_PER_HOUR", demoMode ? 1000 : 10, 1, 100_000),
      maxFailuresPer15Min: int(env, "OTP_MAX_FAILURES_PER_15_MIN", demoMode ? 1000 : 10, 1, 100_000),
    },
    smtp,
    accessLog: flag(env, "LOG_REQUESTS", production),
  };
}
