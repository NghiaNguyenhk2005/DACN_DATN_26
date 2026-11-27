import { HttpStatus, Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { ProblemException } from "../../core/problem";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import { Prisma } from "../../generated/prisma/client";
import { InventoryRepository } from "./inventory.repository";
import { buildSeedStock } from "./seed-stock";
import { duplicateReservation, planReserve, round3, SETTLE_RULES } from "./stock-math";
import type {
  Allocation,
  HoldingFilter,
  HoldingRecord,
  MovementRecord,
  OpenFromBatchInput,
  SettleKind,
  StockLine,
} from "./stock.types";

const SOURCE = "retail_order";
const TX = { maxWait: 15_000, timeout: 30_000 };

interface HoldingRow {
  id: bigint;
  batch_id: bigint;
  product_id: bigint;
  listing_id: bigint;
  batch_code: string;
  product_name: string;
  harvest_date: Date;
  best_before: Date;
  owner_type: HoldingRecord["ownerType"];
  location_type: HoldingRecord["locationType"];
  sale_unit: string;
  qty_on_hand: Prisma.Decimal;
  qty_reserved: Prisma.Decimal;
  is_locked: boolean;
}

interface ReservationRow {
  holding_id: bigint;
  quantity: Prisma.Decimal;
  status: string;
}

function day(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toBigInt(value: string, what: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new ProblemException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", `${what} phải là số nguyên dương: ${value}`);
  }
  return BigInt(value);
}

function fromRow(r: HoldingRow): HoldingRecord {
  return {
    id: r.id.toString(),
    batchId: r.batch_id.toString(),
    productId: r.product_id.toString(),
    listingId: r.listing_id.toString(),
    batchCode: r.batch_code,
    productName: r.product_name,
    harvestDate: day(r.harvest_date),
    bestBefore: day(r.best_before),
    ownerType: r.owner_type,
    locationType: r.location_type,
    saleUnit: r.sale_unit,
    qtyOnHand: Number(r.qty_on_hand),
    qtyReserved: Number(r.qty_reserved),
    isLocked: r.is_locked,
  };
}

function fromModel(m: {
  id: bigint;
  batchId: bigint;
  productId: bigint;
  listingId: bigint;
  batchCode: string;
  productName: string;
  harvestDate: Date;
  bestBefore: Date;
  ownerType: HoldingRecord["ownerType"];
  locationType: HoldingRecord["locationType"];
  saleUnit: string;
  qtyOnHand: Prisma.Decimal;
  qtyReserved: Prisma.Decimal;
  isLocked: boolean;
}): HoldingRecord {
  return fromRow({
    id: m.id,
    batch_id: m.batchId,
    product_id: m.productId,
    listing_id: m.listingId,
    batch_code: m.batchCode,
    product_name: m.productName,
    harvest_date: m.harvestDate,
    best_before: m.bestBefore,
    owner_type: m.ownerType,
    location_type: m.locationType,
    sale_unit: m.saleUnit,
    qty_on_hand: m.qtyOnHand,
    qty_reserved: m.qtyReserved,
    is_locked: m.isLocked,
  });
}

// Kho PostgreSQL của tồn: mọi thao tác ghi chạy trong một transaction, khóa các dòng tồn liên quan bằng
// SELECT ... FOR UPDATE theo thứ tự id để hai đơn nhiều dòng không khóa chéo nhau. CHECK stock_holdings_qty_check là chốt chặn cuối.
@Injectable()
export class PrismaInventoryRepository extends InventoryRepository implements Resettable, OnModuleInit {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    registry: DemoResetRegistry,
  ) {
    super();
    registry.register(this);
  }

  async onModuleInit(): Promise<void> {
    if (this.config.demoMode && (await this.prisma.stockHolding.count()) === 0) await this.seedDemo();
  }

  reset(): Promise<void> {
    return this.seedDemo();
  }

  async findHoldings(filter: HoldingFilter & { listingId?: string } = {}): Promise<HoldingRecord[]> {
    const rows = await this.prisma.stockHolding.findMany({
      where: {
        batchId: filter.batchId ? toBigInt(filter.batchId, "Mã lô") : undefined,
        productId: filter.productId ? toBigInt(filter.productId, "Mã sản phẩm") : undefined,
        listingId: filter.listingId ? toBigInt(filter.listingId, "Mã tin bán") : undefined,
      },
      orderBy: { id: "asc" },
    });
    return rows.map(fromModel);
  }

  async findHolding(id: string): Promise<HoldingRecord | null> {
    if (!/^\d+$/.test(id)) return null;
    const m = await this.prisma.stockHolding.findUnique({ where: { id: BigInt(id) } });
    return m ? fromModel(m) : null;
  }

  async findMovements(holdingId: string): Promise<MovementRecord[]> {
    if (!/^\d+$/.test(holdingId)) return [];
    const rows = await this.prisma.stockMovement.findMany({ where: { holdingId: BigInt(holdingId) }, orderBy: { id: "desc" } });
    return rows.map((r) => ({
      id: r.id.toString(),
      holdingId: r.holdingId.toString(),
      // Enum DB có thêm stocktake_adjust mà hợp đồng chưa có; chưa luồng nào ghi giá trị này.
      movementType: r.movementType as MovementRecord["movementType"],
      quantity: Number(r.quantity),
      sourceType: r.sourceType,
      sourceId: r.sourceId.toString(),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async availabilityByListing(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<{ listing_id: bigint; available: Prisma.Decimal }[]>(Prisma.sql`
      SELECT listing_id, COALESCE(SUM(qty_on_hand - qty_reserved) FILTER (WHERE NOT is_locked), 0) AS available
      FROM inventory.stock_holdings GROUP BY listing_id`);
    return new Map(rows.map((r) => [r.listing_id.toString(), round3(Number(r.available))]));
  }

  async openFromBatch(input: OpenFromBatchInput, now: string): Promise<void> {
    const batchId = toBigInt(input.batchId, "Mã lô");
    const at = new Date(now);
    const quantity = round3(input.quantity);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${"inventory.open:" + input.batchId}, 0))`);
      if ((await tx.stockHolding.count({ where: { batchId } })) > 0) return;
      const holding = await tx.stockHolding.create({
        data: {
          batchId,
          productId: toBigInt(input.productId, "Mã sản phẩm"),
          listingId: toBigInt(input.listingId, "Mã tin bán"),
          batchCode: input.batchCode,
          productName: input.productName,
          harvestDate: new Date(input.harvestDate),
          bestBefore: new Date(input.bestBefore),
          ownerType: "farmery",
          locationType: "farmery_warehouse",
          saleUnit: input.saleUnit,
          qtyOnHand: quantity,
          qtyReserved: 0,
          isLocked: false,
          updatedAt: at,
        },
      });
      await tx.stockMovement.create({
        data: {
          holdingId: holding.id,
          movementType: "open_from_batch",
          quantity,
          sourceType: "batch",
          sourceId: batchId,
          reason: "Nhập kho từ lô đã duyệt",
          createdAt: at,
        },
      });
    }, TX);
  }

  async reserve(ref: string, lines: StockLine[], now: string): Promise<Allocation[]> {
    const sourceId = toBigInt(ref, "Mã đơn");
    const listingIds = [...new Set(lines.map((l) => toBigInt(l.listingId, "Mã tin bán")))];
    const at = new Date(now);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${"inventory.reserve:" + ref}, 0))`);
      if ((await tx.reservation.count({ where: { sourceType: SOURCE, sourceId } })) > 0) throw duplicateReservation(ref);
      const rows = await tx.$queryRaw<HoldingRow[]>(Prisma.sql`
        SELECT * FROM inventory.stock_holdings WHERE listing_id IN (${Prisma.join(listingIds)}) ORDER BY id FOR UPDATE`);
      const { plan, changed } = planReserve(rows.map(fromRow), lines);
      for (const h of changed) {
        await tx.stockHolding.update({ where: { id: BigInt(h.id) }, data: { qtyReserved: h.qtyReserved, updatedAt: at } });
      }
      await tx.stockMovement.createMany({
        data: plan.map((a) => ({
          holdingId: BigInt(a.holdingId),
          movementType: "reserve" as const,
          quantity: -a.quantity,
          sourceType: SOURCE,
          sourceId,
          reason: "Giữ chỗ cho đơn",
          createdAt: at,
        })),
      });
      await tx.reservation.createMany({
        data: plan.map((a) => ({
          holdingId: BigInt(a.holdingId),
          sourceType: SOURCE,
          sourceId,
          quantity: a.quantity,
          status: "active" as const,
          createdAt: at,
        })),
      });
      return plan;
    }, TX);
  }

  async settle(ref: string, kind: SettleKind, reason: string, now: string): Promise<void> {
    const rule = SETTLE_RULES[kind];
    const sourceId = toBigInt(ref, "Mã đơn");
    const at = new Date(now);
    await this.prisma.$transaction(async (tx) => {
      const reservations = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
        SELECT holding_id, quantity, status FROM inventory.reservations
        WHERE source_type = ${SOURCE} AND source_id = ${sourceId} ORDER BY id FOR UPDATE`);
      if (reservations.length === 0 || reservations[0]?.status !== rule.from) return;
      const holdingIds = [...new Set(reservations.map((r) => r.holding_id))];
      const rows = await tx.$queryRaw<HoldingRow[]>(Prisma.sql`
        SELECT * FROM inventory.stock_holdings WHERE id IN (${Prisma.join(holdingIds)}) ORDER BY id FOR UPDATE`);
      const byId = new Map(rows.map((r) => [r.id.toString(), fromRow(r)]));
      const movements: Prisma.StockMovementCreateManyInput[] = [];
      for (const r of reservations) {
        const holding = byId.get(r.holding_id.toString());
        if (!holding) continue;
        const quantity = Number(r.quantity);
        rule.apply(holding, quantity);
        movements.push({
          holdingId: r.holding_id,
          movementType: rule.movementType,
          quantity: rule.sign * quantity,
          sourceType: SOURCE,
          sourceId,
          reason: rule.fixedReason ?? reason,
          createdAt: at,
        });
      }
      for (const h of byId.values()) {
        await tx.stockHolding.update({
          where: { id: BigInt(h.id) },
          data: { qtyOnHand: h.qtyOnHand, qtyReserved: h.qtyReserved, updatedAt: at },
        });
      }
      await tx.stockMovement.createMany({ data: movements });
      await tx.reservation.updateMany({ where: { sourceType: SOURCE, sourceId }, data: { status: rule.to } });
    }, TX);
  }

  // Nạp dữ liệu mẫu (cùng bộ dữ liệu của kho bộ nhớ) sau khi xóa sạch tồn; chỉ gọi ở DEMO_MODE.
  private async seedDemo(): Promise<void> {
    const seed = buildSeedStock();
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`TRUNCATE inventory.stock_movements, inventory.reservations, inventory.stock_holdings RESTART IDENTITY CASCADE`,
      );
      await tx.stockHolding.createMany({
        data: seed.holdings.map((h) => ({
          id: BigInt(h.id),
          batchId: BigInt(h.batchId),
          productId: BigInt(h.productId),
          listingId: BigInt(h.listingId),
          batchCode: h.batchCode,
          productName: h.productName,
          harvestDate: new Date(h.harvestDate),
          bestBefore: new Date(h.bestBefore),
          ownerType: h.ownerType,
          locationType: h.locationType,
          saleUnit: h.saleUnit,
          qtyOnHand: h.qtyOnHand,
          qtyReserved: h.qtyReserved,
          isLocked: h.isLocked,
        })),
      });
      await tx.stockMovement.createMany({
        data: seed.movements.map((m) => ({
          id: BigInt(m.id),
          holdingId: BigInt(m.holdingId),
          movementType: m.movementType,
          quantity: m.quantity,
          sourceType: m.sourceType,
          sourceId: BigInt(m.sourceId),
          reason: m.reason,
          createdAt: new Date(m.createdAt),
        })),
      });
      await tx.$queryRaw(Prisma.sql`SELECT setval(pg_get_serial_sequence('inventory.stock_holdings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM inventory.stock_holdings))`);
      await tx.$queryRaw(Prisma.sql`SELECT setval(pg_get_serial_sequence('inventory.stock_movements', 'id'), (SELECT COALESCE(MAX(id), 1) FROM inventory.stock_movements))`);
    }, TX);
  }
}
