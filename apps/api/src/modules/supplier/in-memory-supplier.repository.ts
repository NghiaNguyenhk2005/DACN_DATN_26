import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { SupplierRepository, type SupplierProfile } from "./supplier.repository";

@Injectable()
export class InMemorySupplierRepository extends SupplierRepository implements Resettable {
  private suppliers: SupplierProfile[] = createSeed().supplierProfiles;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.suppliers = createSeed().supplierProfiles;
  }

  async findById(id: string): Promise<SupplierProfile | null> {
    const found = this.suppliers.find((s) => s.id === id);
    if (!found) return null;
    return structuredClone(found);
  }

  async list(): Promise<SupplierProfile[]> {
    return structuredClone(this.suppliers);
  }
}
