import { Module } from "@nestjs/common";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { SupplierRepository } from "./supplier.repository";
import { InMemorySupplierRepository } from "./in-memory-supplier.repository";

@Module({
  controllers: [SupplierController],
  providers: [
    SupplierService,
    { provide: SupplierRepository, useClass: InMemorySupplierRepository },
  ],
  exports: [SupplierService],
})
export class SupplierModule {}
