import { Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";

export type QuoteRequest = Schema<"QuoteRequest">;

export abstract class QuoteRequestRepository {
  abstract create(request: Omit<QuoteRequest, "id">): Promise<QuoteRequest>;
  abstract listBySupplier(supplierId: string): Promise<QuoteRequest[]>;
}

const FIRST_ID = 8001;

/** Một yêu cầu mẫu gửi HTX Dâu tây Đà Lạt để khu nhà cung cấp có việc cần xử lý khi demo. */
function seed(): QuoteRequest[] {
  return [
    {
      id: String(FIRST_ID),
      productId: "1",
      productName: "Dâu tây Hana Đà Lạt (Hộp 500g)",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerName: "GreenMart — Phòng thu mua",
      quantity: 60,
      saleUnit: "kg",
      neededBy: "2026-12-20",
      note: "Giao kho Thủ Đức, đóng thùng xốp 5 kg, cần hóa đơn VAT.",
      estimatedUnitPrice: 195000,
      status: "sent",
      createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    },
  ];
}

@Injectable()
export class InMemoryQuoteRequestRepository extends QuoteRequestRepository implements Resettable {
  private items: QuoteRequest[] = seed();
  private nextId = FIRST_ID + 1;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.items = seed();
    this.nextId = FIRST_ID + 1;
  }

  async create(request: Omit<QuoteRequest, "id">): Promise<QuoteRequest> {
    const created = { ...request, id: String(this.nextId++) };
    this.items.push(created);
    return structuredClone(created);
  }

  async listBySupplier(supplierId: string): Promise<QuoteRequest[]> {
    return structuredClone(
      this.items.filter((r) => r.supplier.id === supplierId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
}
