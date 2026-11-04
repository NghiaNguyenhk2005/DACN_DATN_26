import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { CatalogModule } from "../catalog/catalog.module";
import { IdentityModule } from "../identity/identity.module";
import { InventoryModule } from "../inventory/inventory.module";
import { OperationsModule } from "../operations/operations.module";
import { PaymentModule } from "../payment/payment.module";
import { AdminOrderController } from "./admin-order.controller";
import { CartRepository } from "./cart.repository";
import { InMemoryCartRepository } from "./in-memory-cart.repository";
import { InMemoryOrderRepository } from "./in-memory-order.repository";
import { OrderRepository } from "./order.repository";
import { RetailController } from "./retail.controller";
import { RetailService } from "./retail.service";

@Module({
  imports: [CoreModule, CatalogModule, InventoryModule, IdentityModule, PaymentModule, OperationsModule],
  controllers: [RetailController, AdminOrderController],
  providers: [
    RetailService,
    { provide: CartRepository, useClass: InMemoryCartRepository },
    { provide: OrderRepository, useClass: InMemoryOrderRepository },
  ],
  exports: [RetailService],
})
export class RetailModule {}
