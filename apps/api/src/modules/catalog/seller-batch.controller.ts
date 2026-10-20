import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CatalogService } from "./catalog.service";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import type { Batch, FarmingLog } from "./batch.repository";

@Controller()
export class SellerBatchController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("seller/products")
  listSellerProducts(): Promise<Schema<"SellerProduct">[]> {
    return this.catalog.listSellerProducts();
  }

  @Get("seller/batches")
  listSellerBatches(
    @Query("productId") productId?: string,
    @Query("status") status?: Schema<"ReviewStatus">,
  ): Promise<Batch[]> {
    return this.catalog.listSellerBatches({ productId, status });
  }

  @Post("seller/batches")
  createBatch(@Body() body: Schema<"BatchInput">): Promise<Batch> {
    return this.catalog.createBatch(body);
  }

  @Get("seller/batches/:batchId")
  getSellerBatch(@Param("batchId") batchId: string): Promise<Batch> {
    return this.catalog.getSellerBatch(batchId);
  }

  @Get("seller/batches/:batchId/logs")
  listFarmingLogs(@Param("batchId") batchId: string): Promise<FarmingLog[]> {
    return this.catalog.listFarmingLogs(batchId);
  }

  @Post("seller/batches/:batchId/logs")
  appendFarmingLog(
    @Param("batchId") batchId: string,
    @Body() body: Schema<"FarmingLogInput">,
    @CurrentUser() user?: AuthUser,
  ): Promise<FarmingLog> {
    return this.catalog.appendFarmingLog(batchId, body, user);
  }
}
