import { readFileSync } from "node:fs";
import type { OpenAPIObject } from "@nestjs/swagger";
import { parse } from "yaml";

// Swagger UI ở /docs phục vụ nguyên packages/contract/openapi.yaml, không sinh spec từ code.
export function loadContractDocument(): OpenAPIObject {
  const path = require.resolve("@farmery/contract/openapi.yaml");
  return parse(readFileSync(path, "utf8")) as OpenAPIObject;
}
