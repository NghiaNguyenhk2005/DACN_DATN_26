import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import { RetailService, type OrderPage } from "./retail.service";

const parseLimit = (v: unknown): number | undefined => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

@Controller()
export class RetailController {
  constructor(private readonly retail: RetailService) {}

  @Get("cart")
  getCart(@CurrentUser() user: AuthUser): Promise<Schema<"Cart">> {
    return this.retail.getCart(user.id);
  }

  @Put("cart/items/:listingId")
  setCartItem(
    @CurrentUser() user: AuthUser,
    @Param("listingId") listingId: string,
    @Body() body: { quantity: number },
  ): Promise<Schema<"Cart">> {
    return this.retail.setCartItem(user.id, listingId, body.quantity);
  }

  @Delete("cart/items/:listingId")
  removeCartItem(@CurrentUser() user: AuthUser, @Param("listingId") listingId: string): Promise<Schema<"Cart">> {
    return this.retail.removeCartItem(user.id, listingId);
  }

  @Post("checkout/quote")
  @HttpCode(HttpStatus.OK)
  quote(@CurrentUser() user: AuthUser, @Body() body: { addressId: string }): Promise<Schema<"CheckoutQuote">> {
    return this.retail.quote(user.id, body.addressId);
  }

  @Get("orders")
  listMyOrders(
    @CurrentUser() user: AuthUser,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ): Promise<OrderPage> {
    return this.retail.listMyOrders(user.id, cursor, parseLimit(limit));
  }

  @Post("orders")
  placeOrder(
    @CurrentUser() user: AuthUser,
    @Body() body: { addressId: string; deliveryDate: string; deliverySlot: string; paymentOption: Schema<"PaymentOption"> },
  ): Promise<Schema<"OrderDetail">> {
    return this.retail.placeOrder(user.id, body);
  }

  @Get("orders/:orderId")
  getMyOrder(@CurrentUser() user: AuthUser, @Param("orderId") orderId: string): Promise<Schema<"OrderDetail">> {
    return this.retail.getMyOrder(user.id, orderId);
  }

  @Post("orders/:orderId/pay")
  @HttpCode(HttpStatus.OK)
  payOrder(@CurrentUser() user: AuthUser, @Param("orderId") orderId: string): Promise<Schema<"OrderDetail">> {
    return this.retail.payOrder(user.id, orderId);
  }

  @Post("orders/:orderId/cancel")
  @HttpCode(HttpStatus.OK)
  cancelMyOrder(@CurrentUser() user: AuthUser, @Param("orderId") orderId: string): Promise<Schema<"OrderDetail">> {
    return this.retail.cancelMyOrder(user.id, orderId);
  }
}
