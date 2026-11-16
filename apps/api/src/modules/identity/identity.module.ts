import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { AccountRepository } from "./account.repository";
import { AddressRepository } from "./address.repository";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";
import { InMemoryAccountRepository } from "./in-memory-account.repository";
import { InMemoryAddressRepository } from "./in-memory-address.repository";

@Module({
  imports: [CoreModule],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    { provide: AccountRepository, useClass: InMemoryAccountRepository },
    { provide: AddressRepository, useClass: InMemoryAddressRepository },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
