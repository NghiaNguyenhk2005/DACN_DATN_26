import { createSeed } from "@farmery/mock-data";
import type { HoldingRecord, MovementRecord } from "./stock.types";

export interface SeedStock {
  holdings: HoldingRecord[];
  movements: MovementRecord[];
}

export const FIRST_HOLDING_ID = 7001;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Tồn ban đầu dựng từ lô đã duyệt: tồn của tin bán (listing.available) chia cho các lô đã duyệt của sản phẩm theo
// tỉ lệ số lượng khai báo, phần dư dồn vào lô hết hạn sớm nhất. Sản phẩm chưa có lô đã duyệt thì chưa có tồn
// (không có lô thì không có mã truy xuất để bán).
export function buildSeedStock(): SeedStock {
  const seed = createSeed();
  const holdings: HoldingRecord[] = [];
  const movements: MovementRecord[] = [];
  let holdingId = FIRST_HOLDING_ID;
  let movementId = 1;

  for (const product of seed.products) {
    const listing = product.listing;
    if (!listing) continue;
    const batches = seed.batches
      .filter((b) => b.productId === product.id && b.status === "approved")
      .sort((a, b) => a.bestBefore.localeCompare(b.bestBefore));
    const declared = batches.reduce((sum, b) => sum + b.declaredQuantity, 0);
    if (batches.length === 0 || declared <= 0) continue;

    let assigned = 0;
    const shares = batches.map((b) => {
      const share = Math.floor((listing.available * b.declaredQuantity) / declared);
      assigned += share;
      return share;
    });
    shares[0] = (shares[0] ?? 0) + (listing.available - assigned);

    batches.forEach((batch, i) => {
      const qty = round3(shares[i] ?? 0);
      const id = String(holdingId++);
      holdings.push({
        id,
        batchId: batch.id,
        batchCode: batch.batchCode,
        productName: batch.productName,
        productId: product.id,
        listingId: listing.id,
        ownerType: "farmery",
        locationType: "farmery_warehouse",
        saleUnit: listing.saleUnit,
        qtyOnHand: qty,
        qtyReserved: 0,
        isLocked: Boolean(batch.recalledAt),
        harvestDate: batch.harvestDate,
        bestBefore: batch.bestBefore,
      });
      movements.push({
        id: String(movementId++),
        holdingId: id,
        movementType: "open_from_batch",
        quantity: qty,
        sourceType: "batch",
        sourceId: batch.id,
        reason: "Nhập kho từ lô đã duyệt",
        createdAt: batch.createdAt,
      });
    });
  }
  return { holdings, movements };
}
