import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { RoleCode } from "@farmery/contract";

export interface AuthUser {
  id: string;
  roles: RoleCode[];
}

interface Claims {
  sub: string;
  roles: RoleCode[];
}

export const JWT_ISSUER = "farmery-api";
export const JWT_AUDIENCE = "farmery";
export const JWT_ALGORITHM = "HS256";
const MAX_ROLES = 16;

// JWT ký thật bằng JWT_SECRET; POST /auth/login (mô-đun identity) gọi sign().
// Thuật toán, issuer, audience được ghim ở cả hai chiều để không nhận token alg:none hay token của hệ khác.
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(user: AuthUser): Promise<string> {
    const claims: Claims = { sub: user.id, roles: user.roles };
    return this.jwt.signAsync(claims, { algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
  }

  async verify(token: string): Promise<AuthUser | undefined> {
    try {
      const claims = await this.jwt.verifyAsync<Partial<Claims>>(token, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      const { sub, roles } = claims;
      const wellFormed =
        typeof sub === "string" &&
        /^[0-9]{1,18}$/.test(sub) &&
        Array.isArray(roles) &&
        roles.length <= MAX_ROLES &&
        roles.every((r) => typeof r === "string");
      return wellFormed ? { id: sub, roles } : undefined;
    } catch {
      return undefined;
    }
  }
}
