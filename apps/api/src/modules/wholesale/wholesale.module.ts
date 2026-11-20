import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { IntegrationsModule } from "../../integrations/integrations.module";
import { CatalogModule } from "../catalog/catalog.module";
import { IdentityModule } from "../identity/identity.module";
import { PaymentModule } from "../payment/payment.module";
import { SupplierModule } from "../supplier/supplier.module";
import { InMemoryQuoteRequestRepository, QuoteRequestRepository } from "./quote-request.repository";
import { WholesaleController } from "./wholesale.controller";
import { WholesaleService } from "./wholesale.service";

// Bán sỉ (3P, FR6.1–6.4): bảng giá sỉ, yêu cầu báo giá 1 lượt, hợp đồng ký OTP, thanh toán qua PaymentService, giao một đợt.
@Module({
  imports: [CoreModule, IntegrationsModule, CatalogModule, IdentityModule, SupplierModule, PaymentModule],
  controllers: [WholesaleController],
  providers: [WholesaleService, { provide: QuoteRequestRepository, useClass: InMemoryQuoteRequestRepository }],
  exports: [WholesaleService],
})
export class WholesaleModule {}
