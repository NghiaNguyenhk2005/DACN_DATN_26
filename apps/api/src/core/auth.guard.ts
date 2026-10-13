import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import type { Request } from "express";
import type { RoleCode } from "@farmery/contract";
import { CONTRACT_DOCUMENT } from "./contract-document";
import { ProblemException } from "./problem";
import { TokenService, type AuthUser } from "./token.service";

interface ContractOperation {
  security?: Record<string, string[]>[];
  "x-roles"?: RoleCode[];
}

export type AuthedRequest = Request & { openapi?: { schema: ContractOperation }; user?: AuthUser };

// Quyền lấy thẳng từ hợp đồng: security: [] là công khai; x-roles là các vai trò được gọi.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CONTRACT_DOCUMENT) private readonly document: OpenAPIObject,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const operation = req.openapi?.schema;
    if (!operation) throw new ProblemException(404, "NOT_IN_CONTRACT");

    const security = operation.security ?? this.document.security ?? [];
    if (security.length === 0) return true;

    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const user = token ? await this.tokens.verify(token) : undefined;
    if (!user) throw new ProblemException(401, "UNAUTHENTICATED", "Thiếu hoặc sai token");
    req.user = user;

    const allowed = operation["x-roles"];
    if (allowed && !user.roles.some((r) => allowed.includes(r))) {
      throw new ProblemException(403, "FORBIDDEN_ROLE", `Cần một trong các vai trò: ${allowed.join(", ")}`);
    }
    return true;
  }
}
