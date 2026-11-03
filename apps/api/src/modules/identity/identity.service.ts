import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { Schema } from "@farmery/contract";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { Clock } from "../../core/clock";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { ProblemException, RateLimitedException } from "../../core/problem";
import { TokenService } from "../../core/token.service";
import { OtpSender } from "../../integrations/otp-sender";
import { AccountRepository, type Account } from "./account.repository";
import { AddressRepository, type Address, type AddressInput } from "./address.repository";

export type Me = Schema<"Me">;

const DEMO_OTP_CODE = "123456";
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const HOUR_MS = 3600 * 1000;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_CHALLENGES = 10_000;
const MAX_TRACKED_EMAILS = 10_000;
const MAX_ADDRESSES_PER_USER = 20;

interface OtpChallenge {
  email: string;
  /** HMAC của mã: bộ nhớ không giữ mã OTP ở dạng đọc được. */
  codeHash: Buffer;
  expiresAt: number;
  attemptsLeft: number;
}

/** Dấu vết theo email để chặn gửi dồn dập và dò mã, tính cả email không tồn tại để không lộ tài khoản nào có thật. */
interface EmailActivity {
  requests: number[];
  failures: number[];
}

/** Bỏ dấu cách/chấm/gạch, đổi +84 thành 0, rồi kiểm đúng 10 số bắt đầu bằng 0. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[ .-]/g, "").replace(/^\+84/, "0");
  if (!/^0[0-9]{9}$/.test(digits)) {
    throw new ProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Số điện thoại phải có 10 số, bắt đầu bằng 0 hoặc +84");
  }
  return digits;
}

@Injectable()
export class IdentityService implements Resettable {
  private challenges = new Map<string, OtpChallenge>();
  private activity = new Map<string, EmailActivity>();
  /** Email vừa dùng để đăng nhập mỗi tài khoản: GET /me trả đúng email đó dù tài khoản có nhiều bí danh. */
  private loginEmails = new Map<string, string>();

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
    this.activity.clear();
    this.loginEmails.clear();
  }

  async requestOtp(rawEmail: string): Promise<{ challengeId: string; expiresAt: string; devCode?: string }> {
    const email = rawEmail.trim().toLowerCase();
    const now = this.clock.now().getTime();
    this.purge(now);
    this.throttleRequest(email, now);

    const account = await this.accounts.findByEmail(email);
    const challengeId = randomUUID();
    const expiresAt = now + OTP_TTL_MS;

    if (!account) {
      // Demo (và hợp đồng): email lạ trả 404. Chạy thật: trả y như thành công để không lộ email nào có tài khoản.
      if (this.config.demoMode) {
        throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không có tài khoản với email này");
      }
      return { challengeId, expiresAt: new Date(expiresAt).toISOString() };
    }

    const code = this.config.demoMode ? DEMO_OTP_CODE : String(randomInt(0, 1_000_000)).padStart(6, "0");
    this.challenges.set(challengeId, { email, codeHash: this.hash(challengeId, code), expiresAt, attemptsLeft: OTP_MAX_ATTEMPTS });
    this.evictOldestChallenges();
    try {
      await this.otpSender.send(email, code);
    } catch (error) {
      this.challenges.delete(challengeId); // không để lại challenge của mã chưa tới tay người dùng
      throw error;
    }

    return {
      challengeId,
      expiresAt: new Date(expiresAt).toISOString(),
      ...(this.config.demoMode ? { devCode: code } : {}),
    };
  }

  async login(challengeId: string, code: string): Promise<{ accessToken: string; user: Me }> {
    const now = this.clock.now().getTime();
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.expiresAt <= now) {
      this.challenges.delete(challengeId);
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "OTP_EXPIRED", "Mã OTP đã hết hạn hoặc không còn hiệu lực, hãy gửi lại mã");
    }
    this.assertNotLockedOut(challenge.email, now);

    if (!this.matches(challengeId, code, challenge.codeHash)) {
      this.recordFailure(challenge.email, now);
      challenge.attemptsLeft -= 1;
      if (challenge.attemptsLeft <= 0) {
        this.challenges.delete(challengeId);
        throw new ProblemException(HttpStatus.UNAUTHORIZED, "OTP_EXPIRED", "Nhập sai quá số lần cho phép, hãy gửi lại mã");
      }
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "OTP_INVALID", "Mã OTP không đúng");
    }
    this.challenges.delete(challengeId); // mỗi mã chỉ dùng một lần
    this.activity.delete(challenge.email);

    const account = await this.accounts.findByEmail(challenge.email);
    if (!account) throw new ProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Tài khoản không còn tồn tại");
    this.loginEmails.set(account.id, challenge.email);
    const accessToken = await this.tokens.sign({ id: account.id, roles: account.roles });
    return { accessToken, user: this.toMe(account) };
  }

  async getMe(userId: string | undefined): Promise<Me> {
    const account = userId ? await this.accounts.findById(userId) : null;
    if (!account) {
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Tài khoản không còn tồn tại");
    }
    return this.toMe(account);
  }

  listAddresses(userId: string): Promise<Address[]> {
    return this.addresses.findByUserId(userId);
  }

  async createAddress(userId: string, input: AddressInput): Promise<Address> {
    if ((await this.addresses.findByUserId(userId)).length >= MAX_ADDRESSES_PER_USER) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "ADDRESS_LIMIT_REACHED",
        `Mỗi tài khoản lưu tối đa ${MAX_ADDRESSES_PER_USER} địa chỉ`,
      );
    }
    return this.addresses.create(userId, { ...input, phone: normalizePhone(input.phone) });
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

  private hash(challengeId: string, code: string): Buffer {
    return createHmac("sha256", this.config.jwtSecret).update(`${challengeId}:${code}`).digest();
  }

  private matches(challengeId: string, code: string, expected: Buffer): boolean {
    return timingSafeEqual(this.hash(challengeId, code), expected);
  }

  private activityOf(email: string): EmailActivity {
    let entry = this.activity.get(email);
    if (!entry) {
      entry = { requests: [], failures: [] };
      this.activity.set(email, entry);
    }
    return entry;
  }

  // Chặn gửi OTP dồn dập: giãn cách tối thiểu giữa hai lần và trần mỗi giờ cho từng email.
  private throttleRequest(email: string, now: number): void {
    const entry = this.activityOf(email);
    entry.requests = entry.requests.filter((t) => now - t < HOUR_MS);
    const { resendCooldownSeconds, maxPerHour } = this.config.otp;
    const last = entry.requests.at(-1);
    if (last !== undefined && now - last < resendCooldownSeconds * 1000) {
      throw new RateLimitedException((resendCooldownSeconds * 1000 - (now - last)) / 1000, "Vừa gửi mã xong, hãy đợi một lúc rồi gửi lại");
    }
    const first = entry.requests[0];
    if (first !== undefined && entry.requests.length >= maxPerHour) {
      throw new RateLimitedException((HOUR_MS - (now - first)) / 1000, "Đã gửi quá nhiều mã cho email này, hãy thử lại sau");
    }
    entry.requests.push(now);
  }

  private recordFailure(email: string, now: number): void {
    const entry = this.activityOf(email);
    entry.failures = entry.failures.filter((t) => now - t < FAILURE_WINDOW_MS);
    entry.failures.push(now);
  }

  // Nhập sai quá nhiều lần (qua mọi challenge của email) thì khóa tạm, chặn dò mã bằng cách xin challenge mới.
  private assertNotLockedOut(email: string, now: number): void {
    const entry = this.activity.get(email);
    if (!entry) return;
    entry.failures = entry.failures.filter((t) => now - t < FAILURE_WINDOW_MS);
    const first = entry.failures[0];
    if (first !== undefined && entry.failures.length >= this.config.otp.maxFailuresPer15Min) {
      throw new RateLimitedException((FAILURE_WINDOW_MS - (now - first)) / 1000, "Nhập sai quá nhiều lần, tạm khóa đăng nhập bằng email này");
    }
  }

  // Giữ bộ nhớ có trần: bỏ challenge hết hạn, dấu vết đã cũ, và cắt bớt phần cũ nhất khi vượt trần.
  private purge(now: number): void {
    for (const [id, c] of this.challenges) if (c.expiresAt <= now) this.challenges.delete(id);
    for (const [email, a] of this.activity) {
      const recent = (t: number) => now - t < HOUR_MS;
      if (!a.requests.some(recent) && !a.failures.some(recent)) this.activity.delete(email);
    }
    while (this.activity.size > MAX_TRACKED_EMAILS) {
      const oldest = this.activity.keys().next().value;
      if (oldest === undefined) break;
      this.activity.delete(oldest);
    }
  }

  private evictOldestChallenges(): void {
    while (this.challenges.size > MAX_CHALLENGES) {
      const oldest = this.challenges.keys().next().value;
      if (oldest === undefined) break;
      this.challenges.delete(oldest);
    }
  }

  private toMe(account: Account): Me {
    return {
      id: account.id,
      displayName: account.displayName,
      email: this.loginEmails.get(account.id) ?? account.emails[0] ?? null,
      phone: account.phone,
      roles: account.roles,
      supplierId: account.supplierId,
    };
  }
}
