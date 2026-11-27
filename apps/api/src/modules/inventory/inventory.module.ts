import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { storageProvider } from "../../core/storage";
import { InMemoryInventoryRepository } from "./in-memory-inventory.repository";
import { InventoryController } from "./inventory.controller";
import { InventoryEvents } from "./inventory-events";
import { InventoryRepository } from "./inventory.repository";
import { InventoryService } from "./inventory.service";
import { PrismaInventoryRepository } from "./prisma-inventory.repository";

@Module({
  imports: [CoreModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryEvents, storageProvider(InventoryRepository, InMemoryInventoryRepository, PrismaInventoryRepository, (config) => config.inventoryStorage)],
  exports: [InventoryService],
})
export class InventoryModule {}
