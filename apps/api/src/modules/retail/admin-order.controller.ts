import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import { RetailService, type OrderPage } from "./retail.service";

// Giám sát và vận hành đơn lẻ (FR10.3). Thuộc nhóm Operations trong hợp đồng, nhưng dữ liệu đơn là của retail.
@Controller("admin/orders")
export class AdminOrderController {
  constructor(private readonly retail: RetailService) {}

  @Get()
  listOrders(
    @Query("status") status?: Schema<"OrderStatus">,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ): Promise<OrderPage> {
    const parsed = limit === undefined || limit === "" ? undefined : Number(limit);
    return this.retail.listOrders(status, cursor, parsed === undefined || Number.isNaN(parsed) ? undefined : parsed);
  }

  @Get(":orderId")
  getOrder(@Param("orderId") orderId: string): Promise<Schema<"OrderDetail">> {
    return this.retail.getOrder(orderId);
  }

  @Post(":orderId/advance")
  @HttpCode(HttpStatus.OK)
  advance(
    @CurrentUser() user: AuthUser,
    @Param("orderId") orderId: string,
    @Body() body?: { note?: string },
  ): Promise<Schema<"OrderDetail">> {
    return this.retail.advanceOrder(orderId, user.roles, body?.note);
  }
}
