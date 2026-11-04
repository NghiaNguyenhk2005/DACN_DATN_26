import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { CatalogModule } from "../catalog/catalog.module";
import { IdentityModule } from "../identity/identity.module";
import { SupplierModule } from "../supplier/supplier.module";
import { InMemoryQuoteRequestRepository, QuoteRequestRepository } from "./quote-request.repository";
import { WholesaleController } from "./wholesale.controller";
import { WholesaleService } from "./wholesale.service";

// Bán sỉ (3P): prototype có bảng giá sỉ (ở catalog) và yêu cầu báo giá; thương lượng, hợp đồng thuộc MVP.
@Module({
  imports: [CoreModule, CatalogModule, IdentityModule, SupplierModule],
  controllers: [WholesaleController],
  providers: [WholesaleService, { provide: QuoteRequestRepository, useClass: InMemoryQuoteRequestRepository }],
})
export class WholesaleModule {}
