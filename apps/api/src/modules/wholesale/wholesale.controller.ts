import { Body, Controller, Get, Post } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import type { QuoteRequest } from "./quote-request.repository";
import { WholesaleService } from "./wholesale.service";

// operationId createQuoteRequest (buyer_wholesale), listSellerQuoteRequests (seller).
@Controller()
export class WholesaleController {
  constructor(private readonly wholesale: WholesaleService) {}

  @Post("wholesale/quote-requests")
  createQuoteRequest(@Body() body: Schema<"QuoteRequestInput">, @CurrentUser() user?: AuthUser): Promise<QuoteRequest> {
    return this.wholesale.createQuoteRequest(user?.id, body);
  }

  @Get("seller/quote-requests")
  listSellerQuoteRequests(@CurrentUser() user?: AuthUser): Promise<QuoteRequest[]> {
    return this.wholesale.listForSeller(user?.id);
  }
}
