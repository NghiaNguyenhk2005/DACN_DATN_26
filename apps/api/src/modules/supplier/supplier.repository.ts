import type { Schema } from "@farmery/contract";

export type SupplierProfile = Schema<"SupplierProfile">;
export type Certification = Schema<"Certification">;

export abstract class SupplierRepository {
  abstract findById(id: string): Promise<SupplierProfile | null>;
  abstract list(): Promise<SupplierProfile[]>;
}
