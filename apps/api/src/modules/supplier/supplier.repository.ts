import type { Schema } from "@farmery/contract";

export type SupplierProfile = Schema<"SupplierProfile">;
export type Certification = Schema<"Certification">;
export type SellerCertification = Schema<"SellerCertification">;

/** Chứng nhận lưu kèm nhà cung cấp và ảnh chứng từ; `valid` tính lúc đọc từ trạng thái duyệt và ngày hết hiệu lực. */
export interface CertificationRecord extends Omit<SellerCertification, "valid"> {
  supplierId: string;
  documentUrl: string | null;
}

export abstract class SupplierRepository {
  abstract findById(id: string): Promise<SupplierProfile | null>;
  abstract list(): Promise<SupplierProfile[]>;
  abstract listCertifications(supplierId: string): Promise<CertificationRecord[]>;
  abstract findCertification(id: string): Promise<CertificationRecord | null>;
  abstract addCertification(record: Omit<CertificationRecord, "id">): Promise<CertificationRecord>;
  abstract updateCertification(id: string, patch: Partial<CertificationRecord>): Promise<CertificationRecord | null>;
}
