import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { InventoryService } from "./inventory.service";

@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("holdings")
  listHoldings(@Query("batchId") batchId?: string, @Query("productId") productId?: string): Promise<Schema<"StockHolding">[]> {
    return this.inventory.listHoldings({ batchId, productId });
  }

  @Get("holdings/:holdingId/movements")
  listMovements(@Param("holdingId") holdingId: string): Promise<Schema<"StockMovement">[]> {
    return this.inventory.listMovements(holdingId);
  }
}
