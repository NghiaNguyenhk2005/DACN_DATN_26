import type { Schema } from "@farmery/contract";

export type Category = Schema<"Category">;

// Cổng lưu trữ của mô-đun: prototype dùng bản trong bộ nhớ, giai đoạn 2 thêm bản Prisma cùng interface.
export abstract class CategoryRepository {
  abstract findTree(): Promise<Category[]>;
}
