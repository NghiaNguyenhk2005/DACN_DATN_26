import { HttpStatus, Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { TokenService } from "../../core/token.service";
import { ProblemException } from "../../core/problem";

export type Me = Schema<"Me">;

interface OtpChallenge {
  email: string;
  code: string;
  expiresAt: string;
}

@Injectable()
export class IdentityService {
  private challenges = new Map<string, OtpChallenge>();

  constructor(private readonly tokenService: TokenService) {}

  requestOtp(email: string): { challengeId: string; expiresAt: string; devCode?: string } {
    const challengeId = `chal-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const devCode = "123456";

    this.challenges.set(challengeId, {
      email,
      code: devCode,
      expiresAt,
    });

    return {
      challengeId,
      expiresAt,
      devCode,
    };
  }

  async login(challengeId: string, code: string): Promise<{ accessToken: string; user: Me }> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.code !== code) {
      throw new ProblemException(
        HttpStatus.UNAUTHORIZED,
        "UNAUTHENTICATED",
        "Mã OTP không đúng hoặc đã hết hạn",
      );
    }

    const email = challenge.email.toLowerCase();
    const isStaff = email.includes("admin") || email.includes("staff");

    let user: Me;
    if (isStaff) {
      user = {
        id: "301",
        displayName: "Cán bộ Kiểm duyệt",
        email: challenge.email,
        phone: null,
        roles: ["staff_moderation", "platform_owner"],
        supplierId: null,
      };
    } else {
      user = {
        id: "201",
        displayName: "HTX Dâu tây Đà Lạt (Nguyễn Văn Nông)",
        email: challenge.email,
        phone: "0912345678",
        roles: ["seller", "buyer_retail"],
        supplierId: "101",
      };
    }

    const accessToken = await this.tokenService.sign({
      id: user.id,
      roles: user.roles,
    });

    return {
      accessToken,
      user,
    };
  }

  getMe(userId?: string): Me {
    if (userId === "301") {
      return {
        id: "301",
        displayName: "Cán bộ Kiểm duyệt",
        email: "kiemduyet@farmery.vn",
        phone: null,
        roles: ["staff_moderation", "platform_owner"],
        supplierId: null,
      };
    }
    return {
      id: "201",
      displayName: "HTX Dâu tây Đà Lạt (Nguyễn Văn Nông)",
      email: "seller@farmery.vn",
      phone: "0912345678",
      roles: ["seller", "buyer_retail"],
      supplierId: "101",
    };
  }
}
