import type { INestApplication } from "@nestjs/common";
import { SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { json } from "express";
import type { Server } from "node:http";
import { APP_CONFIG, type AppConfig } from "./core/app-config";
import { CONTRACT_DOCUMENT } from "./core/contract-document";
import { hardenServer } from "./core/http-server";
import { openApiValidator } from "./core/openapi-validator";
import { applySecurity } from "./core/security";

// Dùng chung cho main.ts và test e2e. App tạo với bodyParser: false để body được đọc trước bộ kiểm hợp đồng.
export function configureApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const document = app.get<OpenAPIObject>(CONTRACT_DOCUMENT);
  app.setGlobalPrefix("api");
  hardenServer(app.getHttpServer() as Server);
  applySecurity(app, config);
  app.enableCors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "Retry-After"],
    maxAge: 600,
  });
  // Hợp đồng chỉ có JSON nhỏ; tải tệp (multipart) chưa hiện thực nên không mở bộ đọc form.
  app.use(json({ limit: "100kb", strict: true }));
  app.use(openApiValidator(document, config));
  if (config.docsEnabled) SwaggerModule.setup("docs", app, document);
}
