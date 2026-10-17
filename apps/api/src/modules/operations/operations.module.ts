import { forwardRef, Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { ReviewTaskRepository } from "./review-task.repository";
import { InMemoryReviewTaskRepository } from "./in-memory-review-task.repository";
import { CatalogModule } from "../catalog/catalog.module";
import { SupplierModule } from "../supplier/supplier.module";
import { CoreModule } from "../../core/core.module";

@Module({
  imports: [forwardRef(() => CatalogModule), SupplierModule, CoreModule],
  controllers: [OperationsController],
  providers: [
    OperationsService,
    {
      provide: ReviewTaskRepository,
      useClass: InMemoryReviewTaskRepository,
    },
  ],
  exports: [OperationsService, ReviewTaskRepository],
})
export class OperationsModule {}
