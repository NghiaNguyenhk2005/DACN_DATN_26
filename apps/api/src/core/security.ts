import { Logger, type INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import type { AppConfig } from "./app-config";
import { problem } from "./problem";

type RequestWithId = Request & { id?: string };

const REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

// Mỗi yêu cầu có một mã (nhận từ X-Request-Id nếu hợp lệ), trả lại ở header và ở `instance` của lỗi để truy vết.
function requestId(): RequestHandler {
  return (req: RequestWithId, res, next) => {
    const incoming = req.header("x-request-id");
    req.id = incoming && REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

function accessLog(): RequestHandler {
  const logger = new Logger("http");
  return (req: RequestWithId, res, next) => {
    const started = Date.now();
    // Chỉ ghi đường dẫn: không ghi query, header, body (có thể chứa token, email, mã OTP).
    res.on("finish", () => logger.log(`${req.id} ${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`));
    next();
  };
}

function noStore(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  };
}

function limiter(config: AppConfig, limit: number): RequestHandler {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS" || req.path === "/api/health",
    handler: (_req: Request, res: Response) => {
      const retryAfter = Math.ceil(config.rateLimit.windowMs / 1000);
      res
        .status(429)
        .set("Retry-After", String(retryAfter))
        .type("application/problem+json")
        .end(JSON.stringify(problem(429, "Quá nhiều yêu cầu", { code: "RATE_LIMITED", detail: "Hãy thử lại sau ít phút" })));
    },
  });
}

/** Mã yêu cầu, header bảo mật, không cache, giới hạn tần suất theo IP. Đặt trước bộ đọc body và bộ kiểm hợp đồng. */
export function applySecurity(app: INestApplication, config: AppConfig): void {
  const express = app.getHttpAdapter().getInstance();
  express.disable("x-powered-by");
  express.disable("etag");
  express.set("trust proxy", config.trustProxy);

  app.use(requestId());
  if (config.accessLog) app.use(accessLog());

  const hsts = config.production ? { maxAge: 15_552_000, includeSubDomains: true } : false;
  const common = { strictTransportSecurity: hsts, crossOriginResourcePolicy: { policy: "same-site" as const } };
  // Swagger UI cần script/style nội tuyến; chỉ nới CSP riêng cho /docs.
  app.use(
    "/docs",
    helmet({
      ...common,
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  // API trả JSON: không cần tải gì khác, cấm nhúng khung.
  app.use(
    helmet({
      ...common,
      contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    }),
  );
  app.use("/api", noStore());

  if (config.rateLimit.enabled) {
    app.use("/api/auth", limiter(config, config.rateLimit.authMax));
    app.use(limiter(config, config.rateLimit.max));
  }
}
