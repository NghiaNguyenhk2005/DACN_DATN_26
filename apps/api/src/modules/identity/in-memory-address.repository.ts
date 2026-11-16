import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { AddressRepository, type Address, type AddressInput } from "./address.repository";

interface Row {
  userId: string;
  address: Address;
}

// Khách lẻ mẫu có sẵn một địa chỉ mặc định ở TP.HCM (vùng giao thí điểm) để demo bước chọn địa chỉ. Tên, số giả.
const SEED_ROWS: Row[] = [
  {
    userId: "202",
    address: {
      id: "500",
      label: "Nhà riêng",
      recipientName: "Trần Minh Anh",
      phone: "0987654321",
      addressLine: "12 Nguyễn Thị Minh Khai",
      ward: "Phường Bến Nghé",
      province: "TP. Hồ Chí Minh",
      isDefault: true,
    },
  },
];

@Injectable()
export class InMemoryAddressRepository extends AddressRepository implements Resettable {
  private rows: Row[] = structuredClone(SEED_ROWS);
  private nextId = 501;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.rows = structuredClone(SEED_ROWS);
    this.nextId = 501;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return this.rows
      .filter((r) => r.userId === userId)
      .map((r) => structuredClone(r.address))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || Number(b.id) - Number(a.id));
  }

  async findOne(userId: string, addressId: string): Promise<Address | null> {
    const row = this.rows.find((r) => r.userId === userId && r.address.id === addressId);
    return row ? structuredClone(row.address) : null;
  }

  async create(userId: string, input: AddressInput): Promise<Address> {
    const mine = this.rows.filter((r) => r.userId === userId);
    const isDefault = input.isDefault === true || mine.length === 0;
    if (isDefault) for (const r of mine) r.address.isDefault = false;
    const address: Address = { ...input, id: String(this.nextId++), isDefault };
    this.rows.push({ userId, address });
    return structuredClone(address);
  }
}
