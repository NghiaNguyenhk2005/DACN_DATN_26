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
import { InventoryModule } from "../inventory/inventory.module";
import { ConceptSemanticSearch, SemanticSearch } from "./search/semantic-search";
import { InMemoryKeywordSearch, KeywordSearch } from "./search/keyword-search";
import { SearchCorpus } from "./search/search-corpus";

// Mô-đun catalog: danh mục, sản phẩm, lô hàng và truy xuất công khai
@Module({
  imports: [
    forwardRef(() => SupplierModule),
    forwardRef(() => OperationsModule),
    CoreModule,
    InventoryModule,
  ],
  controllers: [CatalogController, SellerBatchController],
  providers: [
    CatalogService,
    { provide: CategoryRepository, useClass: InMemoryCategoryRepository },
    { provide: ProductRepository, useClass: InMemoryProductRepository },
    { provide: BatchRepository, useClass: InMemoryBatchRepository },
    SearchCorpus,
    { provide: KeywordSearch, useClass: InMemoryKeywordSearch },
    { provide: SemanticSearch, useClass: ConceptSemanticSearch },
  ],
  exports: [CatalogService, ProductRepository, BatchRepository],
})
export class CatalogModule {}
