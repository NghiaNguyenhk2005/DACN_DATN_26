import { forwardRef, Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { ReviewTaskRepository } from "./review-task.repository";
import { InMemoryReviewTaskRepository } from "./in-memory-review-task.repository";
import { CatalogModule } from "../catalog/catalog.module";
import { SupplierModule } from "../supplier/supplier.module";
import { CoreModule } from "../../core/core.module";
import { InMemoryPlatformSettingsRepository } from "./in-memory-platform-settings.repository";
import { PlatformSettingsRepository } from "./platform-settings.repository";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  imports: [forwardRef(() => CatalogModule), SupplierModule, CoreModule],
  controllers: [OperationsController, SettingsController],
  providers: [
    OperationsService,
    SettingsService,
    { provide: PlatformSettingsRepository, useClass: InMemoryPlatformSettingsRepository },
    {
      provide: ReviewTaskRepository,
      useClass: InMemoryReviewTaskRepository,
    },
  ],
  exports: [OperationsService, ReviewTaskRepository, SettingsService],
})
export class OperationsModule {}
