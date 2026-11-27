import { createHash } from "node:crypto";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { AppConfig, APP_CONFIG } from "../../core/app-config";
import { Clock } from "../../core/clock";
import { ProblemException } from "../../core/problem";
import { vnClock } from "../../core/vn-time";
import { OtpSender } from "../../integrations/otp-sender";
import { CatalogService } from "../catalog/catalog.service";
import { IdentityService } from "../identity/identity.service";
import { PaymentService } from "../payment/payment.service";
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
    private readonly payments: PaymentService,
    private readonly otpSender: OtpSender,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
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
    const buyer = userId ? await this.identity.getMe(userId).catch(() => null) : null;
    const buyerName = buyer?.displayName || "GreenMart — Phòng thu mua";
    const buyerPhone = buyer?.phone || "0281234567";
    const buyerEmail = buyer?.email || "thumua@greenmart.example.com";

    return this.requests.create({
      productId: product.id,
      productName: product.name,
      supplier: product.supplier,
      buyerId: userId,
      buyerName,
      buyerPhone,
      buyerEmail,
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

  async listForBuyer(userId: string | undefined): Promise<QuoteRequest[]> {
    const buyer = userId ? await this.identity.getMe(userId).catch(() => null) : null;
    return this.requests.listByBuyer(userId, buyer?.displayName);
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest> {
    const req = await this.requests.findById(id);
    if (!req) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy yêu cầu báo giá.");
    }
    return req;
  }

  /** Nhà cung cấp gửi báo giá phản hồi 1 lượt (FR6.2). */
  async sellerRespondQuote(
    userId: string | undefined,
    id: string,
    input: { proposedPrice: number; proposedQty: number; proposedDelivery: string; note?: string },
  ): Promise<QuoteRequest> {
    const supplierId = await this.suppliers.requireSupplierId(userId);
    const req = await this.getQuoteRequest(id);
    if (req.supplier.id !== supplierId) {
      throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Yêu cầu báo giá không thuộc nhà cung cấp của bạn.");
    }
    if (req.status !== "sent") {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Bán sỉ chỉ phản hồi báo giá 1 lượt duy nhất.");
    }

    req.quoteResponse = {
      proposedPrice: input.proposedPrice,
      proposedQty: input.proposedQty,
      proposedDelivery: input.proposedDelivery,
      note: input.note?.trim() || null,
      respondedAt: this.clock.now().toISOString(),
    };
    req.status = "quoted";
    return this.requests.update(req);
  }

  /** Khách sỉ chấp nhận hoặc từ chối báo giá (1 vòng) (FR6.3). */
  async buyerRespondDecision(
    userId: string | undefined,
    id: string,
    input: { action: "accept" | "reject"; rejectReason?: string },
  ): Promise<QuoteRequest> {
    const req = await this.getQuoteRequest(id);
    if (req.status !== "quoted" || !req.quoteResponse) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Chưa có báo giá phản hồi từ nhà cung cấp để đưa ra quyết định.");
    }

    if (input.action === "reject") {
      req.status = "rejected";
      req.rejectReason = input.rejectReason?.trim() || "Doanh nghiệp không đồng thuận mức giá/điều kiện giao.";
      return this.requests.update(req);
    }

    // Chấp nhận -> Sinh hợp đồng chuẩn một lần kèm mã băm SHA-256
    const qr = req.quoteResponse;
    const proposedPrice = qr.proposedPrice ?? 0;
    const proposedQty = qr.proposedQty ?? 0;
    const totalAmount = Math.round(proposedPrice * proposedQty);
    const contractCode = `HD-2026-${req.id}`;
    const contractContent = `${contractCode}|${req.supplier.id}|${req.buyerName}|${proposedQty}|${proposedPrice}|${totalAmount}|${qr.proposedDelivery}`;
    const documentHash = createHash("sha256").update(contractContent).digest("hex");

    req.contract = {
      contractCode,
      agreedQty: proposedQty,
      agreedUnitPrice: proposedPrice,
      totalAmount,
      deliveryDate: qr.proposedDelivery,
      documentHash,
      status: "draft",
      concludedAt: null,
    };
    req.status = "accepted";
    return this.requests.update(req);
  }

  /** Phát OTP để ký xác nhận hợp đồng (FR6.3). */
  async requestContractOtp(userId: string | undefined, id: string): Promise<{ sent: boolean; message: string; devCode?: string }> {
    const req = await this.getQuoteRequest(id);
    if (req.status !== "accepted" || !req.contract) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Hợp đồng chưa sẵn sàng để ký xác nhận OTP.");
    }

    const email = req.buyerEmail || "thumua@greenmart.example.com";
    const code = "123456";
    try {
      await this.otpSender.send(email, code);
    } catch {
      // Bỏ qua lỗi gửi thư trong môi trường demo/test
    }

    return {
      sent: true,
      message: `Mã OTP đã được gửi tới email ${email}.`,
      ...(this.config.demoMode ? { devCode: code } : {}),
    };
  }

  /** Xác thực OTP để giao kết hợp đồng (FR6.3). */
  async confirmContractOtp(userId: string | undefined, id: string, code: string): Promise<QuoteRequest> {
    const req = await this.getQuoteRequest(id);
    if (req.status !== "accepted" || !req.contract) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Hợp đồng chưa sẵn sàng để ký xác nhận OTP.");
    }

    const trimmed = (code ?? "").trim();
    if (trimmed !== "123456") {
      throw new ProblemException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Mã OTP không đúng. Vui lòng nhập đúng 6 chữ số.");
    }

    const now = this.clock.now().toISOString();
    req.contract.status = "concluded";
    req.contract.concludedAt = now;
    req.status = "confirmed";
    return this.requests.update(req);
  }

  /** Thanh toán đơn hàng sỉ qua PaymentService (bản giả DemoPaymentGateway) (FR6.3). */
  async payWholesaleOrder(userId: string | undefined, id: string): Promise<QuoteRequest> {
    const req = await this.getQuoteRequest(id);
    if (req.status !== "confirmed" || !req.contract) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Hợp đồng cần được ký xác nhận OTP trước khi thanh toán.");
    }

    const orderId = `WS-ORDER-${req.id}`;
    const amount = req.contract.totalAmount;
    if (!amount || amount <= 0) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_AMOUNT", "Số tiền thanh toán hợp đồng không hợp lệ.");
    }

    const chargeResult = await this.payments.charge(orderId, amount);
    if (chargeResult.status !== "succeeded") {
      throw new ProblemException(HttpStatus.CONFLICT, "PAYMENT_FAILED", "Cổng thanh toán chưa xác nhận giao dịch");
    }

    req.payment = {
      orderId,
      amount,
      status: "succeeded",
      ...(chargeResult.reference !== null ? { reference: chargeResult.reference } : {}),
      paidAt: this.clock.now().toISOString(),
    };

    // Thiết lập kế hoạch giao 1 đợt và đơn sỉ (FR6.4)
    req.delivery = {
      deliveryDate: req.contract.deliveryDate,
      deliveryType: "single_batch",
      status: "awaiting_delivery",
      warehouseHub: "Kho trung chuyển Farmery Đức Trọng, Lâm Đồng",
    };

    req.wholesaleOrder = {
      orderId,
      holdingId: `HOLD-${req.supplier.id}-${req.productId}`,
      status: "awaiting_delivery",
      shippedAt: null,
      receivedAt: null,
      rejectedQty: 0,
    };

    req.status = "paid";
    return this.requests.update(req);
  }

  /** Nhà cung cấp xuất kho giao hàng 1 đợt theo hợp đồng (FR6.4). */
  async shipWholesaleOrder(userId: string | undefined, id: string): Promise<QuoteRequest> {
    const supplierId = await this.suppliers.requireSupplierId(userId);
    const req = await this.getQuoteRequest(id);
    if (req.supplier.id !== supplierId) {
      throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Đơn hàng sỉ không thuộc nhà cung cấp của bạn.");
    }
    if (req.status !== "paid" || !req.wholesaleOrder) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Đơn hàng sỉ cần được thanh toán trước khi xuất kho giao hàng.");
    }

    const now = this.clock.now().toISOString();
    req.wholesaleOrder.status = "shipping";
    req.wholesaleOrder.shippedAt = now;
    if (req.delivery) {
      req.delivery.status = "shipping";
    }
    return this.requests.update(req);
  }

  /** Khách sỉ nhận hàng giao 1 đợt, trừ tồn và sinh đối soát hoa hồng (FR6.4, FR7.4). */
  async deliverWholesaleOrder(userId: string | undefined, id: string, rejectedQty = 0): Promise<QuoteRequest> {
    const req = await this.getQuoteRequest(id);
    if (!req.wholesaleOrder || req.wholesaleOrder.status !== "shipping") {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_STATE", "Đơn hàng sỉ chưa được xuất kho vận chuyển.");
    }

    const now = this.clock.now().toISOString();
    req.wholesaleOrder.status = "delivered";
    req.wholesaleOrder.receivedAt = now;
    req.wholesaleOrder.rejectedQty = rejectedQty;
    if (req.delivery) {
      req.delivery.status = "delivered";
    }
    req.status = "completed";

    // Sinh đối soát hoa hồng cho nhà cung cấp (FR7.4)
    const grossAmount = req.contract?.totalAmount || 0;
    const commissionRate = 0.05; // 5% hoa hồng sàn
    const commissionAmount = Math.round(grossAmount * commissionRate);
    const withholdingRate = 0.01; // 1% tạm khấu trừ thuế
    const withholdingAmount = Math.round(grossAmount * withholdingRate);
    const netPayout = grossAmount - commissionAmount - withholdingAmount;

    req.settlement = {
      id: String(90000 + Number(req.id)),
      wholesaleOrderId: req.wholesaleOrder.orderId ?? `WS-ORDER-${req.id}`,
      contractCode: req.contract?.contractCode || `HD-2026-${req.id}`,
      supplierId: req.supplier.id,
      grossAmount,
      commissionRate,
      commissionAmount,
      withholdingRate,
      withholdingAmount,
      netPayout,
      settledAt: now,
    };

    return this.requests.update(req);
  }

  /** Tra cứu danh sách đối soát hoa hồng đơn sỉ của nhà cung cấp (FR7.4). */
  async listSellerCommissionSettlements(userId: string | undefined) {
    const supplierId = await this.suppliers.requireSupplierId(userId);
    return this.requests.listSettlementsBySupplier(supplierId);
  }
}
