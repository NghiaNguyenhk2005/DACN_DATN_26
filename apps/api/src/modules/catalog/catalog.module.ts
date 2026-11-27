import { forwardRef, Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { SellerBatchController } from "./seller-batch.controller";
import { CatalogService } from "./catalog.service";
import { CategoryRepository } from "./category.repository";
import { InMemoryCategoryRepository } from "./in-memory-category.repository";
import { PrismaCategoryRepository } from "./prisma-category.repository";
import { storageProvider } from "../../core/storage";
import { ProductRepository } from "./product.repository";
import { InMemoryProductRepository } from "./in-memory-product.repository";
import { PrismaProductRepository } from "./prisma-product.repository";
import { BatchRepository } from "./batch.repository";
import { InMemoryBatchRepository } from "./in-memory-batch.repository";
import { PrismaBatchRepository } from "./prisma-batch.repository";
import { SupplierModule } from "../supplier/supplier.module";
import { OperationsModule } from "../operations/operations.module";
import { CoreModule } from "../../core/core.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ConceptSemanticSearch, SemanticSearch } from "./search/semantic-search";
import { InMemoryKeywordSearch, KeywordSearch } from "./search/keyword-search";
import { SearchCorpus } from "./search/search-corpus";
import { ProductEmbeddingIndex } from "./search/product-embedding-index";
import { VectorSemanticSearch } from "./search/vector-semantic-search";
import { EmbeddingProvider } from "../../integrations/embedding-provider";

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
    storageProvider(CategoryRepository, InMemoryCategoryRepository, PrismaCategoryRepository),
    storageProvider(ProductRepository, InMemoryProductRepository, PrismaProductRepository),
    storageProvider(BatchRepository, InMemoryBatchRepository, PrismaBatchRepository),
    SearchCorpus,
    { provide: KeywordSearch, useClass: InMemoryKeywordSearch },
    ProductEmbeddingIndex,
    ConceptSemanticSearch,
    // Có EmbeddingProvider (AI_SERVICE_URL, hoặc bản băm ở test) thì tìm theo vector, không thì từ điển khái niệm.
    {
      provide: SemanticSearch,
      inject: [{ token: EmbeddingProvider, optional: true }, ProductEmbeddingIndex, ConceptSemanticSearch],
      useFactory: (embedder: EmbeddingProvider | null, index: ProductEmbeddingIndex, concept: ConceptSemanticSearch) =>
        embedder ? new VectorSemanticSearch(index, embedder, concept) : concept,
    },
  ],
  exports: [CatalogService, ProductRepository, BatchRepository],
})
export class CatalogModule {}
