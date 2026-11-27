export interface SmtpConfig {
  url: string;
  from: string;
}

export interface AiServiceConfig {
  url: string;
  token: string;
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
  /** Kho dữ liệu của các repository: bộ nhớ (mặc định, có dữ liệu mẫu) hoặc Prisma + PostgreSQL. */
  storage: StorageKind;
  /** Kho của mô-đun tồn kho; mặc định theo `storage`, đặt riêng để chạy hỗn hợp (tồn ở PostgreSQL, còn lại bộ nhớ). */
  inventoryStorage: StorageKind;
  /** Có khi storage hoặc inventoryStorage là "prisma". */
  databaseUrl: string | null;
  /** Dịch vụ AI nội bộ (apps/ai); null thì không bật vector, tìm kiếm dùng từ điển khái niệm. */
  ai: AiServiceConfig | null;
  /** Số tài khoản người mua giả thêm cho kiểm thử tải (kho bộ nhớ); 0 là không thêm, chỉ cho đặt khi DEMO_MODE. */
  loadtestBuyers: number;
}

export type StorageKind = "memory" | "prisma";

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

  const storageRaw = env.STORAGE?.trim() || "memory";
  if (storageRaw !== "memory" && storageRaw !== "prisma") throw new Error("STORAGE phải là memory hoặc prisma");
  const databaseUrl = env.DATABASE_URL?.trim() || null;
  if (storageRaw === "prisma" && !databaseUrl) throw new Error("Thiếu DATABASE_URL khi STORAGE=prisma");
  const inventoryRaw = env.INVENTORY_STORAGE?.trim() || storageRaw;
  if (inventoryRaw !== "memory" && inventoryRaw !== "prisma") throw new Error("INVENTORY_STORAGE phải là memory hoặc prisma");
  if (inventoryRaw === "prisma" && !databaseUrl) throw new Error("Thiếu DATABASE_URL khi INVENTORY_STORAGE=prisma");

  const aiUrl = env.AI_SERVICE_URL?.trim();
  const aiToken = env.AI_SERVICE_TOKEN?.trim();
  if (aiUrl && !/^https?:\/\//.test(aiUrl)) throw new Error("AI_SERVICE_URL phải bắt đầu bằng http:// hoặc https://");
  if (aiUrl && !aiToken) throw new Error("Thiếu AI_SERVICE_TOKEN khi đã đặt AI_SERVICE_URL");
  const ai = aiUrl && aiToken ? { url: aiUrl, token: aiToken } : null;

  const loadtestBuyers = int(env, "LOADTEST_BUYERS", 0, 0, 1000);
  if (loadtestBuyers > 0 && !demoMode) throw new Error("LOADTEST_BUYERS chỉ dùng được khi DEMO_MODE=true");

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
    storage: storageRaw,
    inventoryStorage: inventoryRaw,
    databaseUrl,
    ai,
    loadtestBuyers,
  };
}
