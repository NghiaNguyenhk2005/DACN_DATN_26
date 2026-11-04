import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import { SupplierService } from "./supplier.service";
import type { SellerCertification, SupplierProfile } from "./supplier.repository";

// operationId getSupplierProfile, listSellerCertifications, createSellerCertification.
@Controller()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get("suppliers/:supplierId")
  getSupplierProfile(@Param("supplierId") supplierId: string): Promise<SupplierProfile> {
    return this.supplierService.getSupplierProfile(supplierId);
  }

  @Get("seller/certifications")
  listSellerCertifications(@CurrentUser() user?: AuthUser): Promise<SellerCertification[]> {
    return this.supplierService.listSellerCertifications(user?.id);
  }

  @Post("seller/certifications")
  createSellerCertification(
    @Body() body: Schema<"CertificationInput">,
    @CurrentUser() user?: AuthUser,
  ): Promise<SellerCertification> {
    return this.supplierService.createCertification(user?.id, body);
  }
}
