import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { SupplierRepository, type CertificationRecord, type SupplierProfile } from "./supplier.repository";

const FIRST_CERT_ID = 9001;

function seedCertifications(profiles: SupplierProfile[]): CertificationRecord[] {
  let id = FIRST_CERT_ID;
  return profiles.flatMap((p) =>
    p.certifications.map(({ valid, ...c }) => ({
      ...c,
      id: String(id++),
      supplierId: p.id,
      status: valid ? ("approved" as const) : ("rejected" as const),
      rejectReason: valid ? null : "Chứng nhận đã hết hiệu lực.",
      createdAt: `${c.issuedDate}T00:00:00Z`,
      documentUrl: null,
    })),
  );
}

@Injectable()
export class InMemorySupplierRepository extends SupplierRepository implements Resettable {
  private suppliers: SupplierProfile[] = createSeed().supplierProfiles;
  private certifications: CertificationRecord[] = seedCertifications(this.suppliers);
  private nextCertId = FIRST_CERT_ID + 1000;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.suppliers = createSeed().supplierProfiles;
    this.certifications = seedCertifications(this.suppliers);
    this.nextCertId = FIRST_CERT_ID + 1000;
  }

  async findById(id: string): Promise<SupplierProfile | null> {
    const found = this.suppliers.find((s) => s.id === id);
    if (!found) return null;
    return structuredClone(found);
  }

  async list(): Promise<SupplierProfile[]> {
    return structuredClone(this.suppliers);
  }

  async listCertifications(supplierId: string): Promise<CertificationRecord[]> {
    return structuredClone(this.certifications.filter((c) => c.supplierId === supplierId));
  }

  async findCertification(id: string): Promise<CertificationRecord | null> {
    const found = this.certifications.find((c) => c.id === id);
    return found ? structuredClone(found) : null;
  }

  async addCertification(record: Omit<CertificationRecord, "id">): Promise<CertificationRecord> {
    const created = { ...record, id: String(this.nextCertId++) };
    this.certifications.push(created);
    return structuredClone(created);
  }

  async updateCertification(id: string, patch: Partial<CertificationRecord>): Promise<CertificationRecord | null> {
    const found = this.certifications.find((c) => c.id === id);
    if (!found) return null;
    Object.assign(found, patch);
    return structuredClone(found);
  }
}
