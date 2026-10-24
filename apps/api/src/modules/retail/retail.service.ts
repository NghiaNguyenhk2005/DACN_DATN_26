import { HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { Clock } from "../../core/clock";
import { KeyedMutex } from "../../core/mutex";
import { ProblemException } from "../../core/problem";
import { addDays, vnClock } from "../../core/vn-time";
import { CatalogService } from "../catalog/catalog.service";
import { IdentityService } from "../identity/identity.service";
import { InventoryService } from "../inventory/inventory.service";
import { SettingsService } from "../operations/settings.service";
import type { ResolvedSettings } from "../operations/platform-settings.repository";
import { PaymentService } from "../payment/payment.service";
import { CartRepository } from "./cart.repository";
import { canStaffAdvanceTo, isCancellable, nextStaffStep, type RoleCode } from "./order-state-machine";
import { OrderRepository } from "./order.repository";
import type { OrderItem, OrderRecord, OrderStatus, OrderStatusEvent } from "./order.types";

export type Cart = Schema<"Cart">;
export type CheckoutQuote = Schema<"CheckoutQuote">;
export type OrderDetail = Schema<"OrderDetail">;
export type OrderSummary = Schema<"OrderSummary">;
export interface OrderPage {
  items: OrderSummary[];
  nextCursor: string | null;
}
export interface PlaceOrderInput {
  addressId: string;
  deliveryDate: string;
  deliverySlot: string;
  paymentOption: Schema<"PaymentOption">;
}

const SWEEP_INTERVAL_MS = 10_000;
const SLOT_DAYS = 3;

const money = (n: number): number => Math.round(n);
const qty = (n: number): number => Math.round(n * 1000) / 1000;

function problem(status: number, code: string, detail: string): ProblemException {
  return new ProblemException(status, code, detail);
}

function pageOf<T>(rows: T[], cursor: string | undefined, limit: number | undefined): { slice: T[]; nextCursor: string | null } {
  const size = limit && limit > 0 ? Math.min(limit, 100) : 20;
  const parsed = cursor ? parseInt(cursor, 10) : 0;
  const offset = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  return {
    slice: rows.slice(offset, offset + size),
    nextCursor: offset + size < rows.length ? String(offset + size) : null,
  };
}

@Injectable()
export class RetailService implements OnModuleInit, OnModuleDestroy {
  private readonly mutex = new KeyedMutex();
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly carts: CartRepository,
    private readonly orders: OrderRepository,
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
    private readonly identity: IdentityService,
    private readonly payments: PaymentService,
    private readonly settings: SettingsService,
    private readonly clock: Clock,
  ) {}

  // Đơn quá hạn giữ chỗ tự hủy: quét định kỳ, và quét lại mỗi lần đọc/ghi đơn nên không phụ thuộc vào bộ đếm giờ.
  onModuleInit(): void {
    this.timer = setInterval(() => void this.sweepExpired().catch(() => undefined), SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------------------------------------------------------------- giỏ hàng

  async getCart(userId: string): Promise<Cart> {
    const items: Cart["items"] = [];
    for (const line of await this.carts.findLines(userId)) {
      const listing = await this.catalog.getListing(line.listingId);
      if (!listing) continue; // tin bán đã gỡ
      items.push({
        listingId: listing.listingId,
        productId: listing.productId,
        productName: listing.productName,
        imageUrl: listing.imageUrl,
        saleUnit: listing.saleUnit,
        unitPrice: listing.unitPrice,
        quantity: line.quantity,
        available: await this.inventory.availableForListing(listing.listingId),
        lineTotal: money(listing.unitPrice * line.quantity),
      });
    }
    return { items, subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0) };
  }

  async setCartItem(userId: string, listingId: string, quantity: number): Promise<Cart> {
    const listing = await this.catalog.getListing(listingId);
    if (!listing) throw problem(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy tin bán với ID: ${listingId}`);
    const wanted = qty(quantity);
    const available = await this.inventory.availableForListing(listingId);
    if (wanted > available) {
      throw problem(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "CART_QTY_EXCEEDS_STOCK",
        `${listing.productName}: chỉ còn ${available} ${listing.saleUnit}`,
      );
    }
    await this.carts.setLine(userId, { listingId, quantity: wanted });
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, listingId: string): Promise<Cart> {
    await this.carts.removeLine(userId, listingId);
    return this.getCart(userId);
  }

  // ---------------------------------------------------------------- tính tiền

  async quote(userId: string, addressId: string): Promise<CheckoutQuote> {
    const { quote } = await this.prepareCheckout(userId, addressId, true);
    return quote;
  }

  /**
   * Giỏ, địa chỉ, tiền và khung giờ dùng chung cho quote và đặt đơn. Báo giá cảnh báo sớm vượt tồn (422);
   * lúc đặt thì việc giữ chỗ là nơi quyết định, hết hàng trả 409 STOCK_CONFLICT.
   */
  private async prepareCheckout(userId: string, addressId: string, checkStock: boolean) {
    const cart = await this.getCart(userId);
    if (cart.items.length === 0) throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "CART_EMPTY", "Giỏ hàng đang trống");
    const address = await this.identity.findAddress(userId, addressId);
    if (!address) throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "ADDRESS_NOT_FOUND", "Địa chỉ giao hàng không hợp lệ");
    const over = checkStock ? cart.items.find((i) => i.quantity > i.available) : undefined;
    if (over) {
      throw problem(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "CART_QTY_EXCEEDS_STOCK",
        `${over.productName}: chỉ còn ${over.available} ${over.saleUnit}`,
      );
    }

    const cfg = await this.settings.get();
    const subtotal = cart.subtotal;
    const shippingFee = subtotal >= cfg.freeShippingThreshold ? 0 : cfg.shippingFee;
    const totalAmount = subtotal + shippingFee;
    const refusedCod = await this.identity.hasRefusedCod(userId);
    let codReason: string | null = null;
    if (totalAmount > cfg.codMaxAmount) codReason = `Đơn vượt mức tối đa cho COD (${cfg.codMaxAmount.toLocaleString("vi-VN")} đ)`;
    else if (refusedCod) codReason = "Tài khoản từng từ chối nhận hàng COD";

    const quote: CheckoutQuote = {
      subtotal,
      taxAmount: money((subtotal * cfg.retailVatPercent) / (100 + cfg.retailVatPercent)),
      shippingFee,
      totalAmount,
      codAllowed: codReason === null,
      codReason,
      deliverySlots: this.deliverySlots(cfg),
    };
    return { cart, address, cfg, quote };
  }

  // Ba ngày liền từ hôm nay (giờ Việt Nam). Qua giờ chốt thì hôm nay hết nhận; đơn đó đi chuyến ngày kế tiếp.
  private deliverySlots(cfg: ResolvedSettings): Schema<"DeliverySlotOption">[] {
    const now = vnClock(this.clock.now());
    const result: Schema<"DeliverySlotOption">[] = [];
    for (let d = 0; d < SLOT_DAYS; d++) {
      const date = addDays(now.date, d);
      for (const slot of cfg.deliverySlots) {
        result.push({ date, slot, available: !(d === 0 && now.time >= cfg.cutoffTime) });
      }
    }
    return result;
  }

  // ---------------------------------------------------------------- đặt đơn

  placeOrder(userId: string, input: PlaceOrderInput): Promise<OrderDetail> {
    return this.mutex.runExclusive(`user:${userId}`, async () => {
      await this.sweepExpired(); // nhả hàng của đơn quá hạn trước khi giữ chỗ
      const { cart, address, cfg, quote } = await this.prepareCheckout(userId, input.addressId, false);

      const slot = quote.deliverySlots.find((s) => s.date === input.deliveryDate && s.slot === input.deliverySlot);
      if (!slot || !slot.available) {
        throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "SLOT_UNAVAILABLE", "Khung giờ giao không còn nhận đơn");
      }
      const cod = input.paymentOption === "cod";
      if (cod && !quote.codAllowed) {
        throw problem(HttpStatus.UNPROCESSABLE_ENTITY, "COD_NOT_ALLOWED", quote.codReason ?? "Không được chọn COD");
      }

      const id = await this.orders.nextId();
      const allocations = await this.inventory.reserve(
        id,
        cart.items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
      );

      try {
        const items: OrderItem[] = [];
        for (const line of cart.items) {
          const parts = allocations.filter((a) => a.listingId === line.listingId);
          let assigned = 0;
          for (const [index, part] of parts.entries()) {
            const batch = await this.catalog.getBatchById(part.batchId);
            const last = index === parts.length - 1;
            // Chia tiền theo lô sao cho tổng các dòng đúng bằng tiền của dòng giỏ.
            const lineTotal = last ? line.lineTotal - assigned : money(line.unitPrice * part.quantity);
            assigned += lineTotal;
            items.push({
              productName: line.productName,
              saleUnit: line.saleUnit,
              quantity: part.quantity,
              unitPrice: line.unitPrice,
              lineTotal,
              batchCode: part.batchCode,
              traceCode: batch?.traceCode ?? "",
            });
          }
        }

        const now = this.clock.now();
        const stamp = now.toISOString();
        const day = vnClock(now).date.replaceAll("-", "").slice(2);
        const seq = await this.orders.nextSequence(day);
        const addressInput = {
          ...(address.label ? { label: address.label } : {}),
          recipientName: address.recipientName,
          phone: address.phone,
          addressLine: address.addressLine,
          ward: address.ward,
          province: address.province,
          isDefault: address.isDefault,
        };
        const order: OrderRecord = {
          id,
          orderCode: `FM-${day}-${String(seq).padStart(4, "0")}`,
          userId,
          status: "placed",
          items,
          lineCount: cart.items.length,
          address: addressInput,
          deliveryDate: input.deliveryDate,
          deliverySlot: input.deliverySlot,
          paymentOption: input.paymentOption,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          shippingFee: quote.shippingFee,
          totalAmount: quote.totalAmount,
          placedAt: stamp,
          reserveExpiresAt: cod ? null : new Date(now.getTime() + cfg.reservationMinutes * 60_000).toISOString(),
          timeline: [{ toStatus: "placed", source: "system", note: null, occurredAt: stamp }],
          cancelReason: null,
        };
        if (cod) {
          await this.payments.confirmCod(id, order.totalAmount);
          await this.inventory.consume(id);
          this.transition(order, "paid", "system", "COD hợp lệ, xác nhận ngay");
        }
        await this.orders.create(order);
        await this.carts.clear(userId);
        return this.toDetail(order);
      } catch (error) {
        await this.inventory.release(id, "Đặt đơn thất bại, nhả giữ chỗ");
        throw error;
      }
    });
  }

  async listMyOrders(userId: string, cursor?: string, limit?: number): Promise<OrderPage> {
    await this.sweepExpired();
    const { slice, nextCursor } = pageOf(await this.orders.find({ userId }), cursor, limit);
    return { items: slice.map((o) => this.toSummary(o)), nextCursor };
  }

  async getMyOrder(userId: string, orderId: string): Promise<OrderDetail> {
    const order = await this.loadFresh(orderId);
    if (!order || order.userId !== userId) throw this.notFound(orderId);
    return this.toDetail(order);
  }

  /** Thanh toán giả lập cho đơn trả trước: placed → paid, giữ chỗ chuyển thành trừ tồn. */
  payOrder(userId: string, orderId: string): Promise<OrderDetail> {
    return this.withOrder(orderId, async (order) => {
      if (order.userId !== userId) throw this.notFound(orderId);
      if (order.cancelReason === "reservation_expired") {
        throw problem(HttpStatus.CONFLICT, "RESERVATION_EXPIRED", "Đơn đã quá hạn giữ chỗ và bị hủy");
      }
      if (order.status !== "placed" || order.paymentOption !== "prepaid") {
        throw problem(HttpStatus.CONFLICT, "ORDER_NOT_PAYABLE", "Đơn này không ở trạng thái chờ thanh toán");
      }
      const charge = await this.payments.charge(order.id, order.totalAmount);
      if (charge.status !== "succeeded") {
        throw problem(HttpStatus.CONFLICT, "PAYMENT_FAILED", "Cổng thanh toán từ chối giao dịch");
      }
      await this.inventory.consume(order.id);
      order.reserveExpiresAt = null;
      this.transition(order, "paid", "payment_webhook", "Thanh toán giả lập thành công");
      await this.orders.update(order);
      return this.toDetail(order);
    });
  }

  cancelMyOrder(userId: string, orderId: string): Promise<OrderDetail> {
    return this.withOrder(orderId, async (order) => {
      if (order.userId !== userId) throw this.notFound(orderId);
      if (!isCancellable(order.status)) {
        throw problem(HttpStatus.CONFLICT, "ORDER_NOT_CANCELLABLE", "Đơn đã đóng gói hoặc đã kết thúc, không hủy được");
      }
      if (order.status === "placed") {
        await this.inventory.release(order.id, "Khách hủy đơn");
      } else {
        await this.inventory.returnIn(order.id, "Khách hủy đơn đã thanh toán, hoàn tồn");
        await this.payments.refund(order.id);
      }
      order.reserveExpiresAt = null;
      order.cancelReason = "buyer_cancelled";
      this.transition(order, "cancelled", "system", "Khách hủy đơn");
      await this.orders.update(order);
      return this.toDetail(order);
    });
  }

  // ---------------------------------------------------------------- vận hành (nội bộ)

  async listOrders(status?: OrderStatus, cursor?: string, limit?: number): Promise<OrderPage> {
    await this.sweepExpired();
    const { slice, nextCursor } = pageOf(await this.orders.find({ status }), cursor, limit);
    return { items: await Promise.all(slice.map((o) => this.toInternalSummary(o))), nextCursor };
  }

  async getOrder(orderId: string): Promise<OrderDetail> {
    const order = await this.loadFresh(orderId);
    if (!order) throw this.notFound(orderId);
    return { ...this.toDetail(order), buyerName: await this.buyerName(order) };
  }

  advanceOrder(orderId: string, roles: readonly RoleCode[], note?: string): Promise<OrderDetail> {
    return this.withOrder(orderId, async (order) => {
      const next = nextStaffStep(order.status);
      if (!next) {
        throw problem(
          HttpStatus.CONFLICT,
          "ORDER_TRANSITION_INVALID",
          `Đơn đang ở trạng thái ${order.status}, không chuyển bước tiếp được`,
        );
      }
      if (!canStaffAdvanceTo(roles, next)) {
        throw problem(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE", `Vai trò hiện tại không được chuyển đơn sang ${next}`);
      }
      this.transition(order, next, "staff", note?.trim() ? note.trim() : null);
      await this.orders.update(order);
      return { ...this.toDetail(order), buyerName: await this.buyerName(order) };
    });
  }

  // ---------------------------------------------------------------- hết hạn giữ chỗ

  /** Hủy mọi đơn trả trước đã quá hạn giữ chỗ và nhả hàng. */
  async sweepExpired(): Promise<void> {
    const due = await this.orders.findHoldsDueBy(this.clock.now().toISOString());
    for (const order of due) await this.loadFresh(order.id);
  }

  private async expireIfDue(order: OrderRecord): Promise<OrderRecord> {
    const due = order.status === "placed" && order.reserveExpiresAt !== null && order.reserveExpiresAt <= this.clock.now().toISOString();
    if (!due) return order;
    await this.inventory.release(order.id, "Quá hạn giữ chỗ, tự hủy đơn");
    order.reserveExpiresAt = null;
    order.cancelReason = "reservation_expired";
    this.transition(order, "cancelled", "system", "Quá hạn giữ chỗ, đơn tự hủy");
    await this.orders.update(order);
    return order;
  }

  /** Đọc đơn, tự hủy nếu đã quá hạn. */
  private loadFresh(orderId: string): Promise<OrderRecord | null> {
    return this.withOrder(orderId, async (order) => order).catch((error: unknown) => {
      if (error instanceof ProblemException && error.getStatus() === HttpStatus.NOT_FOUND) return null;
      throw error;
    });
  }

  /** Chạy một thao tác trên đơn dưới khóa riêng của đơn, sau khi áp luật hết hạn giữ chỗ. */
  private withOrder<T>(orderId: string, work: (order: OrderRecord) => Promise<T>): Promise<T> {
    return this.mutex.runExclusive(`order:${orderId}`, async () => {
      const found = await this.orders.findById(orderId);
      if (!found) throw this.notFound(orderId);
      const order = await this.expireIfDue(found);
      return work(order);
    });
  }

  // ---------------------------------------------------------------- chuyển đổi dữ liệu

  private transition(order: OrderRecord, to: OrderStatus, source: OrderStatusEvent["source"], note: string | null): void {
    order.status = to;
    order.timeline.push({ toStatus: to, source, note, occurredAt: this.clock.now().toISOString() });
  }

  private notFound(orderId: string): ProblemException {
    return problem(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy đơn với ID: ${orderId}`);
  }

  private async buyerName(order: OrderRecord): Promise<string> {
    return (await this.identity.displayName(order.userId)) ?? "Khách lẻ";
  }

  private toSummary(o: OrderRecord): OrderSummary {
    return {
      id: o.id,
      orderCode: o.orderCode,
      status: o.status,
      totalAmount: o.totalAmount,
      itemCount: o.lineCount,
      placedAt: o.placedAt,
    };
  }

  private async toInternalSummary(o: OrderRecord): Promise<OrderSummary> {
    return { ...this.toSummary(o), buyerName: await this.buyerName(o) };
  }

  private toDetail(o: OrderRecord): OrderDetail {
    return {
      ...this.toSummary(o),
      items: o.items,
      address: o.address,
      deliveryDate: o.deliveryDate,
      deliverySlot: o.deliverySlot,
      paymentOption: o.paymentOption,
      subtotal: o.subtotal,
      taxAmount: o.taxAmount,
      shippingFee: o.shippingFee,
      reserveExpiresAt: o.status === "placed" ? o.reserveExpiresAt : null,
      timeline: o.timeline,
      cancellable: isCancellable(o.status),
    };
  }
}
