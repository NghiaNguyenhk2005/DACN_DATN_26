import { Injectable } from "@nestjs/common";
import type { DomainEvent } from "../../core/events/events";
import { OnDomainEvent } from "../../core/events/on-domain-event";
import { InventoryService } from "./inventory.service";

// Bên nhận của inventory theo Phụ lục V: BatchApproved mở dòng tồn của Farmery cho lô vừa duyệt.
@Injectable()
export class InventoryEvents {
  constructor(private readonly inventory: InventoryService) {}

  @OnDomainEvent("BatchApproved")
  async onBatchApproved({ payload }: DomainEvent<"BatchApproved">): Promise<void> {
    if (!payload.listing) return;
    await this.inventory.openFromBatch({
      batchId: payload.batchId,
      batchCode: payload.batchCode,
      productId: payload.productId,
      listingId: payload.listing.id,
      productName: payload.productName,
      saleUnit: payload.listing.saleUnit,
      quantity: payload.quantity,
      harvestDate: payload.harvestDate,
      bestBefore: payload.bestBefore,
    });
  }
}
