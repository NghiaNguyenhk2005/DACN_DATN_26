import { OnEvent } from "@nestjs/event-emitter";
import type { DomainEvent, EventName } from "./events";

const MAX_REMEMBERED = 10_000;
const handled = new Set<string>(); // "<id sự kiện>|<bên nhận>" đã xử lý xong; giữ trong bộ nhớ, mất khi khởi động lại

function remember(key: string): void {
  handled.add(key);
  if (handled.size > MAX_REMEMBERED) handled.delete(handled.values().next().value as string);
}

// Đăng ký bên nhận sự kiện và bỏ qua bản gửi lại: cùng (id sự kiện, bên nhận) chỉ chạy thành công một lần. Lỗi thì lần gửi lại được chạy lại.
export function OnDomainEvent<K extends EventName>(name: K): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const original = descriptor.value as unknown as (event: DomainEvent<K>) => Promise<void> | void;
    const consumer = `${target.constructor.name}.${String(propertyKey)}`;
    (descriptor as PropertyDescriptor).value = async function (this: unknown, event: DomainEvent<K>): Promise<void> {
      const key = `${event.id}|${consumer}`;
      if (handled.has(key)) return;
      await original.call(this, event);
      remember(key);
    };
    OnEvent(name)(target, propertyKey, descriptor);
  };
}
