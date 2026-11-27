import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { storageProvider } from "../../core/storage";
import { AccountRepository } from "./account.repository";
import { AddressRepository } from "./address.repository";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";
import { InMemoryAccountRepository } from "./in-memory-account.repository";
import { InMemoryAddressRepository } from "./in-memory-address.repository";
import { PrismaAccountRepository } from "./prisma-account.repository";

@Module({
  imports: [CoreModule],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    storageProvider(AccountRepository, InMemoryAccountRepository, PrismaAccountRepository),
    { provide: AddressRepository, useClass: InMemoryAddressRepository },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
