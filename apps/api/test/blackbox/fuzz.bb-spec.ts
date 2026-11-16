import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { call, login, MAIN, type Reply } from "./client";

// Fuzz sinh từ chính openapi.yaml: mỗi thao tác nhận hàng chục đầu vào xấu (sai kiểu, quá dài, thiếu, thừa,
// id lạ, query rác) với đủ loại danh tính. Yêu cầu duy nhất: không có 5xx (trừ 501 cho thao tác chưa có),
// và mọi lỗi là problem+json không lộ chi tiết nội bộ.

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const doc: Json = parse(readFileSync(path.resolve(__dirname, "../../../../packages/contract/openapi.yaml"), "utf8"));

function deref(node: Json): Json {
  if (node && typeof node === "object" && typeof node.$ref === "string") {
    return node.$ref
      .replace(/^#\//, "")
      .split("/")
      .reduce((acc: Json, key: string) => deref(acc)[key], doc);
  }
  return node;
}

function sample(schema: Json, depth = 0): Json {
  const s = deref(schema) ?? {};
  if (s.allOf) return Object.assign({}, ...s.allOf.map((x: Json) => sample(x, depth + 1)));
  if (s.oneOf || s.anyOf) return sample((s.oneOf ?? s.anyOf)[0], depth + 1);
  if (s.enum) return s.enum[0];
  if (s.example !== undefined) return s.example;
  if (s.examples?.length) return s.examples[0];
  const type = Array.isArray(s.type) ? s.type.find((t: string) => t !== "null") : s.type;
  switch (type) {
    case "object": {
      if (depth > 3) return {};
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries<Json>(s.properties ?? {})) out[k] = sample(v, depth + 1);
      return out;
    }
    case "array":
      return depth > 3 ? [] : [sample(s.items, depth + 1)];
    case "integer":
    case "number":
      return s.minimum ?? 1;
    case "boolean":
      return true;
    case "string":
      if (s.format === "email") return "khachle@example.com";
      if (s.format === "date") return "2026-10-30";
      if (s.format === "date-time") return "2026-10-30T10:00:00Z";
      if (s.format === "uuid") return randomUUID();
      if (s.pattern === "^[0-9]+$") return "1";
      return "x";
    default:
      return "x";
  }
}

const HOSTILE: unknown[] = [null, 12345, -1, 1e308, true, "", "x".repeat(5000), "<script>alert(1)</script>", "'; DROP TABLE orders;--", "\u0000", {}, [], { a: { b: { c: 1 } } }, ["x"]];
const HOSTILE_IDS = ["0", "1", "99999999999999999999", "abc", "%00", "..%2f..%2fetc%2fpasswd", "%27%20OR%201%3D1", "a".repeat(400), "%E0%A4%A", "%3Cscript%3E"];
const HOSTILE_QUERY = ["", "abc", "-1", "99999999999", "%00", "a".repeat(500), "1;2", "%27", "null", "true"];

const ACCOUNT_BY_ROLE: Record<string, string> = {
  seller: "seller@farmery.vn",
  buyer_retail: "khachle@example.com",
  staff_moderation: "staff@example.com",
  staff_operations: "vanhanh@farmery.vn",
  staff_warehouse: "kho@farmery.vn",
  staff_sourcing: "thumua@farmery.vn",
  staff_support: "hotro@farmery.vn",
  platform_owner: "chu@farmery.vn",
};

interface Op {
  name: string;
  method: string;
  path: string;
  op: Json;
}

const SKIP = new Set(["/dev/reset", "/health"]); // reset xóa dữ liệu giữa chừng; health vô hại
const operations: Op[] = [];
for (const [p, item] of Object.entries<Json>(doc.paths)) {
  if (SKIP.has(p)) continue;
  for (const method of ["get", "post", "put", "delete"]) {
    if (item[method]) operations.push({ name: `${method.toUpperCase()} ${p}`, method: method.toUpperCase(), path: p, op: item[method] });
  }
}

const unimplemented = new Set<string>();
const tokens = new Map<string, string>();

async function tokenFor(op: Json): Promise<string | undefined> {
  if (Array.isArray(op.security) && op.security.length === 0) return undefined;
  const role = (op["x-roles"] as string[] | undefined)?.find((r) => ACCOUNT_BY_ROLE[r]) ?? "buyer_retail";
  const email = ACCOUNT_BY_ROLE[role] as string;
  if (!tokens.has(email)) tokens.set(email, await login(MAIN(), email));
  return tokens.get(email);
}

function paramsOf(op: Json, item: Json, where: string): Json[] {
  return [...(item.parameters ?? []), ...(op.parameters ?? [])].map(deref).filter((p: Json) => p.in === where);
}

function fill(template: string, pathParams: Json[], value: (name: string) => string): string {
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => (pathParams.some((p) => p.name === name) ? value(name) : "1"));
}

function assertSane(res: Reply, label: string): void {
  const problems: string[] = [];
  if (res.status >= 500 && res.status !== 501) problems.push(`status ${res.status}`);
  if (res.status >= 400) {
    if (!(res.headers.get("content-type") ?? "").includes("application/problem+json")) problems.push(`content-type ${res.headers.get("content-type")}`);
    if (/node_modules|\.js:\d+|\bat .*\(.*:\d+:\d+\)/.test(res.text)) problems.push("lộ stack/đường dẫn nội bộ");
  }
  if (res.status === 501) unimplemented.add(label.split(" | ")[0] as string);
  if (problems.length) throw new Error(`${label}\n  → ${problems.join("; ")}\n  → ${res.text.slice(0, 300)}`);
}

describe("Fuzz theo hợp đồng: không 5xx, lỗi luôn là problem+json", () => {
  it.each(operations)("$name", async ({ name, method, path: template, op }) => {
    const item = doc.paths[template];
    const pathParams = paramsOf(op, item, "path");
    const queryParams = paramsOf(op, item, "query");
    const headerParams = paramsOf(op, item, "header");
    const token = await tokenFor(op);
    const wrongRoleToken = tokens.get(ACCOUNT_BY_ROLE.seller as string) ?? (await login(MAIN(), ACCOUNT_BY_ROLE.seller as string));
    tokens.set(ACCOUNT_BY_ROLE.seller as string, wrongRoleToken);

    const bodySchema = op.requestBody?.content?.["application/json"]?.schema;
    const validBody = bodySchema ? sample(bodySchema) : undefined;
    const extraHeaders = () => Object.fromEntries(headerParams.map((h: Json) => [h.name, h.name.toLowerCase() === "idempotency-key" ? randomUUID() : "x"]));

    const send = async (urlPath: string, body: unknown, label: string, opts: { raw?: string; token?: string | null } = {}) => {
      const useToken = opts.token === null ? undefined : (opts.token ?? token);
      const res = await call(MAIN(), method, `/api${urlPath}`, {
        token: useToken,
        headers: extraHeaders(),
        ...(opts.raw !== undefined ? { raw: opts.raw, } : body !== undefined ? { body } : {}),
      });
      assertSane(res, `${name} | ${label}`);
    };

    const okPath = fill(template, pathParams, () => "1");
    const query = (name: string, v: string) => `?${name}=${v}`;

    // 1. Danh tính: không token, sai vai trò.
    await send(okPath, validBody, "không token", { token: null });
    await send(okPath, validBody, "token sai vai trò", { token: wrongRoleToken });

    // 2. Body: hợp lệ, rỗng, null, mảng, JSON hỏng, thừa trường.
    await send(okPath, validBody, "body mẫu");
    if (bodySchema) {
      await send(okPath, {}, "body {}");
      await send(okPath, undefined, "body null", { raw: "null" });
      await send(okPath, [], "body []");
      await send(okPath, undefined, "JSON hỏng", { raw: '{"a":' });
      await send(okPath, { ...(validBody as object), __extra__: "x", id: "1", userId: "301", roles: ["platform_owner"] }, "trường thừa");
      for (const [prop] of Object.entries<Json>(deref(bodySchema).properties ?? {}).slice(0, 8)) {
        for (const bad of HOSTILE) await send(okPath, { ...(validBody as object), [prop]: bad }, `body.${prop}=${JSON.stringify(bad)?.slice(0, 30)}`);
      }
    }

    // 3. Tham số đường dẫn.
    for (const p of pathParams) {
      for (const bad of HOSTILE_IDS) await send(fill(template, pathParams, (n) => (n === p.name ? bad : "1")), validBody, `path.${p.name}=${bad.slice(0, 30)}`);
    }

    // 4. Tham số query.
    for (const q of queryParams) {
      for (const bad of HOSTILE_QUERY) await send(`${okPath}${query(q.name, bad)}`, validBody, `query.${q.name}=${bad.slice(0, 30)}`);
    }
  });

  afterAll(() => {
    // Ghi ra để người đọc thấy thao tác nào còn là placeholder (501) thay vì bị bỏ sót lặng lẽ.
    console.log(`Thao tác có trong hợp đồng nhưng chưa có endpoint (501): ${[...unimplemented].sort().join(", ") || "không có"}`);
  });
});
