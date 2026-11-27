import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import type { QuoteRequest } from "./quote-request.repository";
import { WholesaleService } from "./wholesale.service";

@Controller()
export class WholesaleController {
  constructor(private readonly wholesale: WholesaleService) {}

  @Post("wholesale/quote-requests")
  createQuoteRequest(@Body() body: Schema<"QuoteRequestInput">, @CurrentUser() user?: AuthUser): Promise<QuoteRequest> {
    return this.wholesale.createQuoteRequest(user?.id, body);
  }

  @Get("wholesale/quote-requests")
  listBuyerQuoteRequests(@CurrentUser() user?: AuthUser): Promise<QuoteRequest[]> {
    return this.wholesale.listForBuyer(user?.id);
  }

  @Get("wholesale/quote-requests/:id")
  getQuoteRequest(@Param("id") id: string): Promise<QuoteRequest> {
    return this.wholesale.getQuoteRequest(id);
  }

  @Get("seller/quote-requests")
  listSellerQuoteRequests(@CurrentUser() user?: AuthUser): Promise<QuoteRequest[]> {
    return this.wholesale.listForSeller(user?.id);
  }

  @Post("seller/quote-requests/:id/quote")
  @HttpCode(HttpStatus.OK)
  respondSellerQuoteRequest(
    @Param("id") id: string,
    @Body() body: { proposedPrice: number; proposedQty: number; proposedDelivery: string; note?: string },
    @CurrentUser() user?: AuthUser,
  ): Promise<QuoteRequest> {
    return this.wholesale.sellerRespondQuote(user?.id, id, body);
  }

  @Post("wholesale/quote-requests/:id/respond")
  @HttpCode(HttpStatus.OK)
  respondBuyerQuoteDecision(
    @Param("id") id: string,
    @Body() body: { action: "accept" | "reject"; rejectReason?: string },
    @CurrentUser() user?: AuthUser,
  ): Promise<QuoteRequest> {
    return this.wholesale.buyerRespondDecision(user?.id, id, body);
  }

  @Post("wholesale/quote-requests/:id/request-otp")
  @HttpCode(HttpStatus.OK)
  requestWholesaleContractOtp(
    @Param("id") id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ sent: boolean; message: string; devCode?: string }> {
    return this.wholesale.requestContractOtp(user?.id, id);
  }

  @Post("wholesale/quote-requests/:id/confirm-otp")
  @HttpCode(HttpStatus.OK)
  confirmWholesaleContractOtp(
    @Param("id") id: string,
    @Body() body: { code: string },
    @CurrentUser() user?: AuthUser,
  ): Promise<QuoteRequest> {
    return this.wholesale.confirmContractOtp(user?.id, id, body.code);
  }

  @Post("wholesale/quote-requests/:id/pay")
  @HttpCode(HttpStatus.OK)
  payWholesaleOrder(@Param("id") id: string, @CurrentUser() user?: AuthUser): Promise<QuoteRequest> {
    return this.wholesale.payWholesaleOrder(user?.id, id);
  }

  @Post("wholesale/quote-requests/:id/ship")
  @HttpCode(HttpStatus.OK)
  shipWholesaleOrder(@Param("id") id: string, @CurrentUser() user?: AuthUser): Promise<QuoteRequest> {
    return this.wholesale.shipWholesaleOrder(user?.id, id);
  }

  @Post("wholesale/quote-requests/:id/deliver")
  @HttpCode(HttpStatus.OK)
  deliverWholesaleOrder(
    @Param("id") id: string,
    @Body() body: { rejectedQty?: number },
    @CurrentUser() user?: AuthUser,
  ): Promise<QuoteRequest> {
    return this.wholesale.deliverWholesaleOrder(user?.id, id, body?.rejectedQty);
  }

  @Get("seller/commission-settlements")
  @HttpCode(HttpStatus.OK)
  listSellerCommissionSettlements(@CurrentUser() user?: AuthUser) {
    return this.wholesale.listSellerCommissionSettlements(user?.id);
  }
}
