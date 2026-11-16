import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { randomUUID } from "node:crypto";
import { Clock } from "../clock";
import type { DomainEvent, EventName, EventPayloads } from "./events";

// Cổng phát sự kiện giữa các mô-đun; bản NestEventBus chạy trong tiến trình, thay bản Redis không phải sửa nơi gọi.
export abstract class EventBus {
  /** Phát và chờ mọi bên nhận xử lý xong. Lỗi ở bên nhận được ghi log, không ném về bên phát. */
  abstract publish<K extends EventName>(name: K, payload: EventPayloads[K]): Promise<DomainEvent<K>>;
  /** Gửi lại một sự kiện đã có phong bì (cùng id); bên nhận dùng @OnDomainEvent chỉ xử lý một lần. */
  abstract deliver<K extends EventName>(event: DomainEvent<K>): Promise<void>;
}

@Injectable()
export class NestEventBus extends EventBus {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly clock: Clock,
  ) {
    super();
  }

  async publish<K extends EventName>(name: K, payload: EventPayloads[K]): Promise<DomainEvent<K>> {
    const event: DomainEvent<K> = { id: randomUUID(), name, occurredAt: this.clock.now().toISOString(), payload };
    await this.deliver(event);
    return event;
  }

  async deliver<K extends EventName>(event: DomainEvent<K>): Promise<void> {
    await this.emitter.emitAsync(event.name, event);
  }
}
