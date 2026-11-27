import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { storageProvider } from "../../core/storage";
import { InMemoryPaymentRepository } from "./in-memory-payment.repository";
import { PaymentRepository } from "./payment.repository";
import { PaymentService } from "./payment.service";
import { PrismaPaymentRepository } from "./prisma-payment.repository";

@Module({
  imports: [CoreModule],
  providers: [PaymentService, storageProvider(PaymentRepository, InMemoryPaymentRepository, PrismaPaymentRepository)],
  exports: [PaymentService],
})
export class PaymentModule {}
