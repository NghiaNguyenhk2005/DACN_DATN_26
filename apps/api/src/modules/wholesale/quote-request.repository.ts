import { Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";

export type QuoteRequest = Schema<"QuoteRequest">;

export abstract class QuoteRequestRepository {
  abstract create(request: Omit<QuoteRequest, "id">): Promise<QuoteRequest>;
  abstract findById(id: string): Promise<QuoteRequest | null>;
  abstract update(request: QuoteRequest): Promise<QuoteRequest>;
  abstract listBySupplier(supplierId: string): Promise<QuoteRequest[]>;
  abstract listByBuyer(buyerId?: string, buyerName?: string): Promise<QuoteRequest[]>;
}

const FIRST_ID = 8001;

/** Dữ liệu mẫu phong phú bao gồm các giai đoạn của quy trình bán sỉ: gửi RFQ -> báo giá 1 lượt -> ký OTP -> thanh toán -> giao 1 đợt. */
function seed(): QuoteRequest[] {
  return [
    {
      id: String(FIRST_ID),
      productId: "1",
      productName: "Dâu tây Hana Đà Lạt (Hộp 500g)",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerId: "204",
      buyerName: "GreenMart — Phòng thu mua",
      buyerPhone: "0281234567",
      buyerEmail: "thumua@greenmart.example.com",
      quantity: 60,
      saleUnit: "kg",
      neededBy: "2026-12-20",
      note: "Giao kho Thủ Đức, đóng thùng xốp 5 kg, cần hóa đơn VAT.",
      estimatedUnitPrice: 195000,
      status: "sent",
      createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    },
    {
      id: "8002",
      productId: "17",
      productName: "Bơ sáp 034 Lâm Đồng",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerId: "204",
      buyerName: "GreenMart — Phòng thu mua",
      buyerPhone: "0281234567",
      buyerEmail: "thumua@greenmart.example.com",
      quantity: 300,
      saleUnit: "kg",
      neededBy: "2026-12-15",
      note: "Quả đều từ 400g trở lên, độ chín 75%, đóng sọt nhựa có lót rơm.",
      estimatedUnitPrice: 55000,
      status: "quoted",
      createdAt: new Date(Date.now() - 24 * 3_600_000).toISOString(),
      quoteResponse: {
        proposedPrice: 52000,
        proposedQty: 300,
        proposedDelivery: "2026-12-14",
        note: "HTX đáp ứng đủ 300kg bơ sáp 034 đạt chuẩn VietGAP, giá ưu đãi 52.000đ/kg đã gồm sọt nhựa và kiểm định.",
        respondedAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
      },
    },
    {
      id: "8003",
      productId: "1",
      productName: "Xà lách Lô lô xanh Thủy canh VietGAP",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerId: "204",
      buyerName: "GreenMart — Phòng thu mua",
      buyerPhone: "0281234567",
      buyerEmail: "thumua@greenmart.example.com",
      quantity: 200,
      saleUnit: "kg",
      neededBy: "2026-12-18",
      note: "Cắt sát gốc sáng sớm, chuyển xe lạnh về kho trung chuyển.",
      estimatedUnitPrice: 40000,
      status: "accepted",
      createdAt: new Date(Date.now() - 48 * 3_600_000).toISOString(),
      quoteResponse: {
        proposedPrice: 38000,
        proposedQty: 200,
        proposedDelivery: "2026-12-18",
        note: "Đồng ý cung cấp 200kg xà lách thủy canh thu hoạch cùng ngày.",
        respondedAt: new Date(Date.now() - 36 * 3_600_000).toISOString(),
      },
      contract: {
        contractCode: "HD-2026-8003",
        agreedQty: 200,
        agreedUnitPrice: 38000,
        totalAmount: 7600000,
        deliveryDate: "2026-12-18",
        documentHash: "a7c8d9e0f123456789abcdef0123456789abcdef0123456789abcdef01234567",
        status: "draft",
        concludedAt: null,
      },
    },
    {
      id: "8004",
      productId: "1",
      productName: "Cà chua bi Cherry đỏ Đà Lạt",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerId: "204",
      buyerName: "GreenMart — Phòng thu mua",
      buyerPhone: "0281234567",
      buyerEmail: "thumua@greenmart.example.com",
      quantity: 150,
      saleUnit: "kg",
      neededBy: "2026-12-10",
      note: "Hộp 1kg hoặc sọt 5kg.",
      estimatedUnitPrice: 48000,
      status: "confirmed",
      createdAt: new Date(Date.now() - 72 * 3_600_000).toISOString(),
      quoteResponse: {
        proposedPrice: 45000,
        proposedQty: 150,
        proposedDelivery: "2026-12-10",
        note: "Cà chua bi hái đúng độ chín, đóng hộp 1kg có quai xách.",
        respondedAt: new Date(Date.now() - 60 * 3_600_000).toISOString(),
      },
      contract: {
        contractCode: "HD-2026-8004",
        agreedQty: 150,
        agreedUnitPrice: 45000,
        totalAmount: 6750000,
        deliveryDate: "2026-12-10",
        documentHash: "b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852",
        status: "concluded",
        concludedAt: new Date(Date.now() - 48 * 3_600_000).toISOString(),
      },
    },
    {
      id: "8005",
      productId: "1",
      productName: "Khoai lang mật Đà Lạt loại 1",
      supplier: { id: "101", displayName: "HTX Dâu tây Đà Lạt", growingRegion: "Phường Lâm Viên - Đà Lạt, Lâm Đồng" },
      buyerId: "204",
      buyerName: "GreenMart — Phòng thu mua",
      buyerPhone: "0281234567",
      buyerEmail: "thumua@greenmart.example.com",
      quantity: 500,
      saleUnit: "kg",
      neededBy: "2026-12-05",
      note: "Khoai ủ mật, củ đều 200g-300g, rửa sạch phơi ráo.",
      estimatedUnitPrice: 32000,
      status: "paid",
      createdAt: new Date(Date.now() - 96 * 3_600_000).toISOString(),
      quoteResponse: {
        proposedPrice: 30000,
        proposedQty: 500,
        proposedDelivery: "2026-12-05",
        note: "Khoai lang mật chuẩn Đà Lạt, bao ngọt dẻo.",
        respondedAt: new Date(Date.now() - 80 * 3_600_000).toISOString(),
      },
      contract: {
        contractCode: "HD-2026-8005",
        agreedQty: 500,
        agreedUnitPrice: 30000,
        totalAmount: 15000000,
        deliveryDate: "2026-12-05",
        documentHash: "c966f4c1d553a98ea2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
        status: "concluded",
        concludedAt: new Date(Date.now() - 70 * 3_600_000).toISOString(),
      },
      payment: {
        orderId: "WS-ORDER-8005",
        amount: 15000000,
        status: "succeeded",
        reference: "DEMO-PAY-WS-8005",
        paidAt: new Date(Date.now() - 65 * 3_600_000).toISOString(),
      },
      delivery: {
        deliveryDate: "2026-12-05",
        deliveryType: "single_batch",
        status: "awaiting_delivery",
        warehouseHub: "Kho trung chuyển Farmery Đức Trọng, Lâm Đồng",
      },
    },
  ];
}

@Injectable()
export class InMemoryQuoteRequestRepository extends QuoteRequestRepository implements Resettable {
  private items: QuoteRequest[] = seed();
  private nextId = 8006;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.items = seed();
    this.nextId = 8006;
  }

  async create(request: Omit<QuoteRequest, "id">): Promise<QuoteRequest> {
    const created = { ...request, id: String(this.nextId++) };
    this.items.push(created);
    return structuredClone(created);
  }

  async findById(id: string): Promise<QuoteRequest | null> {
    const found = this.items.find((r) => r.id === id);
    return found ? structuredClone(found) : null;
  }

  async update(request: QuoteRequest): Promise<QuoteRequest> {
    const index = this.items.findIndex((r) => r.id === request.id);
    if (index === -1) {
      this.items.push(request);
    } else {
      this.items[index] = structuredClone(request);
    }
    return structuredClone(request);
  }

  async listBySupplier(supplierId: string): Promise<QuoteRequest[]> {
    return structuredClone(
      this.items.filter((r) => r.supplier.id === supplierId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async listByBuyer(buyerId?: string, buyerName?: string): Promise<QuoteRequest[]> {
    return structuredClone(
      this.items
        .filter((r) => (buyerId && r.buyerId === buyerId) || (buyerName && r.buyerName === buyerName) || (!r.buyerId && buyerId === "204"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
}
