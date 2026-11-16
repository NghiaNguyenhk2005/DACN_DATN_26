import { HttpStatus, Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { Clock } from "../../core/clock";
import { ProblemException } from "../../core/problem";
import { vnClock } from "../../core/vn-time";
import { CatalogService } from "../catalog/catalog.service";
import { IdentityService } from "../identity/identity.service";
import { SupplierService } from "../supplier/supplier.service";
import { QuoteRequestRepository, type QuoteRequest } from "./quote-request.repository";

/** Đơn giá theo bậc: bậc có lượng tối thiểu lớn nhất mà sản lượng đạt tới. */
export function tierPrice(offer: Schema<"WholesaleOffer">, quantity: number): number | null {
  const reached = offer.tiers.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity);
  return reached[0]?.unitPrice ?? null;
}

@Injectable()
export class WholesaleService {
  constructor(
    private readonly requests: QuoteRequestRepository,
    private readonly catalog: CatalogService,
    private readonly identity: IdentityService,
    private readonly suppliers: SupplierService,
    private readonly clock: Clock,
  ) {}

  async createQuoteRequest(userId: string | undefined, input: Schema<"QuoteRequestInput">): Promise<QuoteRequest> {
    const product = await this.catalog.getProduct(input.productId);
    const offer = product.wholesale;
    if (!offer) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "WHOLESALE_NOT_OFFERED",
        "Nhà cung cấp chưa nhận bán sỉ sản phẩm này.",
      );
    }
    if (input.quantity < offer.minQuantity) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "BELOW_MIN_QUANTITY",
        `Lượng tối thiểu là ${offer.minQuantity.toLocaleString("vi-VN")} ${offer.saleUnit}.`,
      );
    }
    if (input.neededBy < vnClock(this.clock.now()).date) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", "Ngày cần hàng không được ở quá khứ.");
    }
    const buyerName = (userId && (await this.identity.displayName(userId))) || "Doanh nghiệp mua sỉ";
    return this.requests.create({
      productId: product.id,
      productName: product.name,
      supplier: product.supplier,
      buyerName,
      quantity: input.quantity,
      saleUnit: offer.saleUnit,
      neededBy: input.neededBy,
      note: input.note?.trim() || null,
      estimatedUnitPrice: tierPrice(offer, input.quantity),
      status: "sent",
      createdAt: this.clock.now().toISOString(),
    });
  }

  async listForSeller(userId: string | undefined): Promise<QuoteRequest[]> {
    const supplierId = await this.suppliers.requireSupplierId(userId);
    return this.requests.listBySupplier(supplierId);
  }
}
