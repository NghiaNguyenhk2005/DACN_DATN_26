import { readFileSync } from "node:fs";
import type { OpenAPIObject } from "@nestjs/swagger";
import { parse } from "yaml";

export const CONTRACT_DOCUMENT = Symbol("CONTRACT_DOCUMENT");

// Nguồn duy nhất: packages/contract/openapi.yaml — Swagger, bộ kiểm dữ liệu và AuthGuard đều đọc file này.
export function loadContractDocument(): OpenAPIObject {
  const path = require.resolve("@farmery/contract/openapi.yaml");
  return parse(readFileSync(path, "utf8")) as OpenAPIObject;
}
