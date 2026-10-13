import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Response } from "express";
import { Observable, of, tap } from "rxjs";
import type { AuthedRequest } from "./auth.guard";
import { DemoResetRegistry, type Resettable } from "./demo-reset.registry";

interface Stored {
  status: number;
  body: unknown;
}

// POST có Idempotency-Key: gửi lại cùng key trả lại kết quả lần đầu. Giai đoạn 2 chuyển kho sang Redis.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor, Resettable {
  private readonly store = new Map<string, Stored>();

  constructor(registry: DemoResetRegistry) {
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
    const hit = this.store.get(storeKey);
    if (hit) {
      res.status(hit.status);
      return of(hit.body);
    }
    return next.handle().pipe(tap((body) => this.store.set(storeKey, { status: res.statusCode, body })));
  }
}
