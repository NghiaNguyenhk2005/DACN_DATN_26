import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { InMemoryPaymentRepository } from "./in-memory-payment.repository";
import { PaymentRepository } from "./payment.repository";
import { PaymentService } from "./payment.service";

@Module({
  imports: [CoreModule],
  providers: [PaymentService, { provide: PaymentRepository, useClass: InMemoryPaymentRepository }],
  exports: [PaymentService],
})
export class PaymentModule {}
