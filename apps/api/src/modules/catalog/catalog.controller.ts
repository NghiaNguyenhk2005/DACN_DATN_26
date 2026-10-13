import { Controller, Get } from "@nestjs/common";
import type { Category } from "./category.repository";
import { CatalogService } from "./catalog.service";

// operationId listCategories; kiểu trả về lấy từ hợp đồng nên lệch schema là lỗi kiểm kiểu.
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  listCategories(): Promise<Category[]> {
    return this.catalog.listCategories();
  }
}
