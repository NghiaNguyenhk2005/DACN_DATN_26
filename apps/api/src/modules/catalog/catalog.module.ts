import { forwardRef, Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { SellerBatchController } from "./seller-batch.controller";
import { CatalogService } from "./catalog.service";
import { CategoryRepository } from "./category.repository";
import { InMemoryCategoryRepository } from "./in-memory-category.repository";
import { ProductRepository } from "./product.repository";
import { InMemoryProductRepository } from "./in-memory-product.repository";
import { BatchRepository } from "./batch.repository";
import { InMemoryBatchRepository } from "./in-memory-batch.repository";
import { SupplierModule } from "../supplier/supplier.module";
import { OperationsModule } from "../operations/operations.module";
import { CoreModule } from "../../core/core.module";

// Mô-đun catalog: danh mục, sản phẩm, lô hàng và truy xuất công khai
@Module({
  imports: [
    SupplierModule,
    forwardRef(() => OperationsModule),
    CoreModule,
  ],
  controllers: [CatalogController, SellerBatchController],
  providers: [
    CatalogService,
    { provide: CategoryRepository, useClass: InMemoryCategoryRepository },
    { provide: ProductRepository, useClass: InMemoryProductRepository },
    { provide: BatchRepository, useClass: InMemoryBatchRepository },
  ],
  exports: [CatalogService, ProductRepository, BatchRepository],
})
export class CatalogModule {}
