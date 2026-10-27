import { HttpStatus, Injectable } from "@nestjs/common";
import { ProblemException } from "../../core/problem";
import { SupplierRepository, type SupplierProfile, type Certification } from "./supplier.repository";

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async getSupplierProfile(id: string): Promise<SupplierProfile> {
    const profile = await this.supplierRepo.findById(id);
    if (!profile) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy nhà cung cấp với ID: ${id}`);
    }
    return profile;
  }

  async getSupplierCertifications(id: string): Promise<Certification[]> {
    const profile = await this.supplierRepo.findById(id);
    return profile ? profile.certifications : [];
  }
}
