import { forwardRef, Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { storageProvider } from "../../core/storage";
import { IdentityModule } from "../identity/identity.module";
import { OperationsModule } from "../operations/operations.module";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { SupplierRepository } from "./supplier.repository";
import { InMemorySupplierRepository } from "./in-memory-supplier.repository";
import { PrismaSupplierRepository } from "./prisma-supplier.repository";

@Module({
  imports: [CoreModule, IdentityModule, forwardRef(() => OperationsModule)],
  controllers: [SupplierController],
  providers: [
    SupplierService,
    storageProvider(SupplierRepository, InMemorySupplierRepository, PrismaSupplierRepository),
  ],
  exports: [SupplierService],
})
export class SupplierModule {}
