import { Injectable } from "@nestjs/common";

export interface Resettable {
  reset(): void;
}

// Kho trong bộ nhớ tự đăng ký vào đây; POST /dev/reset gọi reset() của tất cả.
@Injectable()
export class DemoResetRegistry {
  private readonly items: Resettable[] = [];

  register(item: Resettable): void {
    this.items.push(item);
  }

  resetAll(): void {
    for (const item of this.items) item.reset();
  }
}
