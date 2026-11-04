import { forwardRef, Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { IdentityModule } from "../identity/identity.module";
import { OperationsModule } from "../operations/operations.module";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { SupplierRepository } from "./supplier.repository";
import { InMemorySupplierRepository } from "./in-memory-supplier.repository";

@Module({
  imports: [CoreModule, IdentityModule, forwardRef(() => OperationsModule)],
  controllers: [SupplierController],
  providers: [
    SupplierService,
    { provide: SupplierRepository, useClass: InMemorySupplierRepository },
  ],
  exports: [SupplierService],
})
export class SupplierModule {}
