import { Injectable } from "@nestjs/common";
import { createSeed, type Seed } from "@farmery/mock-data";

// Kho dữ liệu trong bộ nhớ dùng chung cho mọi module; giai đoạn 2 thay bằng Prisma.
@Injectable()
export class MockStore {
  data: Seed = createSeed();

  reset(): void {
    this.data = createSeed();
  }
}
