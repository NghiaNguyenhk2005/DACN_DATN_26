import { Controller, Get, Param } from "@nestjs/common";
import { SupplierService } from "./supplier.service";
import type { SupplierProfile } from "./supplier.repository";

// operationId getSupplierProfile; đường dẫn không có /api; kiểu trả về lấy từ hợp đồng.
@Controller()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get("suppliers/:supplierId")
  getSupplierProfile(@Param("supplierId") supplierId: string): Promise<SupplierProfile> {
    return this.supplierService.getSupplierProfile(supplierId);
  }
}
