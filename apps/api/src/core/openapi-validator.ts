import type { RequestHandler } from "express";
import * as OpenApiValidator from "express-openapi-validator";
import type { OpenAPIObject } from "@nestjs/swagger";
import type { AppConfig } from "./app-config";

// Kiểm dữ liệu vào (và phản hồi khi validateResponses) theo openapi.yaml; gắn req.openapi cho AuthGuard.
export function openApiValidator(document: OpenAPIObject, config: AppConfig): RequestHandler[] {
  return OpenApiValidator.middleware({
    apiSpec: structuredClone(document) as never,
    validateRequests: true,
    validateResponses: config.validateResponses,
    validateSecurity: false,
  }) as RequestHandler[];
}
