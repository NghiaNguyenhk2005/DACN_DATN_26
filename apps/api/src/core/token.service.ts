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

// JWT ký thật bằng JWT_SECRET; POST /auth/login (mô-đun identity) gọi sign().
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(user: AuthUser): Promise<string> {
    const claims: Claims = { sub: user.id, roles: user.roles };
    return this.jwt.signAsync(claims);
  }

  async verify(token: string): Promise<AuthUser | undefined> {
    try {
      const claims = await this.jwt.verifyAsync<Claims>(token);
      return { id: claims.sub, roles: claims.roles };
    } catch {
      return undefined;
    }
  }
}
