import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { randomInt, randomUUID } from "node:crypto";
import type { Schema } from "@farmery/contract";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { Clock } from "../../core/clock";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { ProblemException } from "../../core/problem";
import { TokenService } from "../../core/token.service";
import { OtpSender } from "../../integrations/otp-sender";
import { AccountRepository, type Account } from "./account.repository";
import { AddressRepository, type Address, type AddressInput } from "./address.repository";

export type Me = Schema<"Me">;

const DEMO_OTP_CODE = "123456";
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

interface OtpChallenge {
  email: string;
  code: string;
  expiresAt: number;
  attemptsLeft: number;
}

@Injectable()
export class IdentityService implements Resettable {
  private challenges = new Map<string, OtpChallenge>();

  constructor(
    private readonly accounts: AccountRepository,
    private readonly addresses: AddressRepository,
    private readonly tokens: TokenService,
    private readonly otpSender: OtpSender,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    registry: DemoResetRegistry,
  ) {
    registry.register(this);
  }

  reset(): void {
    this.challenges.clear();
  }

  async requestOtp(rawEmail: string): Promise<{ challengeId: string; expiresAt: string; devCode?: string }> {
    const email = rawEmail.trim().toLowerCase();
    // Thật: chỉ gửi cho tài khoản đã có. Demo: email lạ tự đăng ký thành khách lẻ ở bước đăng nhập.
    if (!this.config.demoMode && !(await this.accounts.findByEmail(email))) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không có tài khoản với email này");
    }

    const code = this.config.demoMode ? DEMO_OTP_CODE : String(randomInt(0, 1_000_000)).padStart(6, "0");
    const challengeId = randomUUID();
    const expiresAt = this.clock.now().getTime() + OTP_TTL_MS;
    this.challenges.set(challengeId, { email, code, expiresAt, attemptsLeft: OTP_MAX_ATTEMPTS });
    await this.otpSender.send(email, code);

    return {
      challengeId,
      expiresAt: new Date(expiresAt).toISOString(),
      ...(this.config.demoMode ? { devCode: code } : {}),
    };
  }

  async login(challengeId: string, code: string): Promise<{ accessToken: string; user: Me }> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.expiresAt <= this.clock.now().getTime()) {
      this.challenges.delete(challengeId);
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Mã OTP không đúng hoặc đã hết hạn");
    }
    if (challenge.code !== code) {
      challenge.attemptsLeft -= 1;
      if (challenge.attemptsLeft <= 0) this.challenges.delete(challengeId);
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Mã OTP không đúng hoặc đã hết hạn");
    }
    this.challenges.delete(challengeId); // mỗi mã chỉ dùng một lần

    const account = await this.resolveAccount(challenge.email);
    const accessToken = await this.tokens.sign({ id: account.id, roles: account.roles });
    return { accessToken, user: toMe(account) };
  }

  async getMe(userId: string | undefined): Promise<Me> {
    const account = userId ? await this.accounts.findById(userId) : null;
    if (!account) {
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Tài khoản không còn tồn tại");
    }
    return toMe(account);
  }

  listAddresses(userId: string): Promise<Address[]> {
    return this.addresses.findByUserId(userId);
  }

  createAddress(userId: string, input: AddressInput): Promise<Address> {
    return this.addresses.create(userId, input);
  }

  /** Dành cho mô-đun khác (retail): địa chỉ phải thuộc đúng người dùng. */
  findAddress(userId: string, addressId: string): Promise<Address | null> {
    return this.addresses.findOne(userId, addressId);
  }

  async displayName(userId: string): Promise<string | null> {
    return (await this.accounts.findById(userId))?.displayName ?? null;
  }

  async hasRefusedCod(userId: string): Promise<boolean> {
    return (await this.accounts.findById(userId))?.refusedCod ?? false;
  }

  private async resolveAccount(email: string): Promise<Account> {
    const existing = await this.accounts.findByEmail(email);
    if (existing) return existing;
    return this.accounts.create({
      emails: [email],
      displayName: `Khách lẻ ${email.split("@")[0]}`,
      phone: null,
      roles: ["buyer_retail"],
      supplierId: null,
      refusedCod: false,
    });
  }
}

function toMe(account: Account): Me {
  return {
    id: account.id,
    displayName: account.displayName,
    email: account.emails[0] ?? null,
    phone: account.phone,
    roles: account.roles,
    supplierId: account.supplierId,
  };
}
