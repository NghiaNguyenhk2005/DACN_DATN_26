import type { INestApplication } from "@nestjs/common";
import { SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import { APP_CONFIG, type AppConfig } from "./core/app-config";
import { CONTRACT_DOCUMENT } from "./core/contract-document";
import { openApiValidator } from "./core/openapi-validator";

// Dùng chung cho main.ts và test e2e. App tạo với bodyParser: false để body được đọc trước bộ kiểm hợp đồng.
export function configureApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const document = app.get<OpenAPIObject>(CONTRACT_DOCUMENT);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.corsOrigins });
  app.use(json({ limit: "1mb" }), urlencoded({ extended: true }));
  app.use(openApiValidator(document, config));
  SwaggerModule.setup("docs", app, document);
}
