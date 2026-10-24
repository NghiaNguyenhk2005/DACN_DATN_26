import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { InMemoryInventoryRepository } from "./in-memory-inventory.repository";
import { InventoryController } from "./inventory.controller";
import { InventoryRepository } from "./inventory.repository";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [CoreModule],
  controllers: [InventoryController],
  providers: [InventoryService, { provide: InventoryRepository, useClass: InMemoryInventoryRepository }],
  exports: [InventoryService],
})
export class InventoryModule {}
