import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Response } from "express";
import { createHash } from "node:crypto";
import { Observable, from, of, tap } from "rxjs";
import type { AuthedRequest } from "./auth.guard";
import { Clock } from "./clock";
import { DemoResetRegistry, type Resettable } from "./demo-reset.registry";
import { ProblemException } from "./problem";

const TTL_MS = 24 * 3600 * 1000;
const MAX_ENTRIES = 10_000;

interface Entry {
  fingerprint: string;
  expiresAt: number;
  /** Kết quả khi đã xong; undefined khi yêu cầu đầu còn đang chạy hoặc đã lỗi. */
  result?: { status: number; body: unknown };
  /** Hoàn tất khi yêu cầu đầu kết thúc (thành công hay lỗi), để yêu cầu trùng đang chờ biết đường đi tiếp. */
  settled: Promise<void>;
  settle: () => void;
}

// POST có Idempotency-Key: gửi lại cùng key (cùng nội dung) trả lại kết quả lần đầu, kể cả khi hai yêu cầu
// đến cùng lúc: yêu cầu sau chờ yêu cầu đầu. Cùng key mà khác nội dung bị từ chối 422. Chỉ nhớ kết quả
// thành công; lỗi thì cho phép thử lại. Có hạn dùng và số lượng tối đa. Giai đoạn 2 chuyển kho sang Redis.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor, Resettable {
  private readonly store = new Map<string, Entry>();

  constructor(
    registry: DemoResetRegistry,
    private readonly clock: Clock,
  ) {
    registry.register(this);
  }

  reset(): void {
    this.store.clear();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const key = req.header("idempotency-key");
    if (req.method !== "POST" || !key) return next.handle();

    const res = context.switchToHttp().getResponse<Response>();
    const storeKey = `${req.user?.id ?? "anon"} ${req.path} ${key}`;
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(req.body ?? null))
      .digest("hex");
    return this.run(storeKey, fingerprint, res, next);
  }

  private run(storeKey: string, fingerprint: string, res: Response, next: CallHandler): Observable<unknown> {
    this.evictExpired();
    const existing = this.store.get(storeKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new ProblemException(422, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key này đã dùng cho một yêu cầu có nội dung khác");
      }
      if (existing.result) {
        res.status(existing.result.status);
        return of(existing.result.body);
      }
      // Yêu cầu đầu còn đang chạy: chờ nó xong rồi trả cùng kết quả, hoặc tự chạy nếu nó đã lỗi.
      return from(existing.settled).pipe(
        (source) => new Observable((subscriber) => source.subscribe({ complete: () => this.run(storeKey, fingerprint, res, next).subscribe(subscriber) })),
      );
    }

    let settle!: () => void;
    const settled = new Promise<void>((resolve) => (settle = resolve));
    const entry: Entry = { fingerprint, expiresAt: this.clock.now().getTime() + TTL_MS, settled, settle };
    this.store.set(storeKey, entry);
    this.evictOverflow();

    return next.handle().pipe(
      tap({
        next: (body) => {
          entry.result = { status: res.statusCode, body };
        },
        error: () => {
          this.store.delete(storeKey); // lỗi thì không nhớ, cho phép thử lại
        },
        finalize: () => entry.settle(),
      }),
    );
  }

  private evictExpired(): void {
    const now = this.clock.now().getTime();
    for (const [k, e] of this.store) if (e.expiresAt <= now && e.result) this.store.delete(k);
  }

  private evictOverflow(): void {
    while (this.store.size > MAX_ENTRIES) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) return;
      this.store.delete(oldest);
    }
  }
}
