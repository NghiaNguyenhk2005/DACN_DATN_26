import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { CategoryRepository } from "./category.repository";
import { InMemoryCategoryRepository } from "./in-memory-category.repository";

// Mô-đun mẫu: controller → service → repository. Mô-đun khác chỉ gọi CatalogService, không chạm repository.
@Module({
  controllers: [CatalogController],
  providers: [CatalogService, { provide: CategoryRepository, useClass: InMemoryCategoryRepository }],
  exports: [CatalogService],
})
export class CatalogModule {}
