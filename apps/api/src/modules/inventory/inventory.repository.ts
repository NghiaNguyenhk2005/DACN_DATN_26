import type {
  Allocation,
  HoldingFilter,
  HoldingRecord,
  MovementRecord,
  OpenFromBatchInput,
  SettleKind,
  StockLine,
} from "./stock.types";

// Đọc không cần khóa. Mỗi thao tác ghi là một đơn vị nguyên tử: bản bộ nhớ tuần tự hóa bằng khóa trong tiến trình,
// bản PostgreSQL chạy trong một transaction với SELECT ... FOR UPDATE.
export abstract class InventoryRepository {
  abstract findHoldings(filter?: HoldingFilter & { listingId?: string }): Promise<HoldingRecord[]>;
  abstract findHolding(id: string): Promise<HoldingRecord | null>;
  abstract findMovements(holdingId: string): Promise<MovementRecord[]>;
  /** Lượng còn bán được theo mã tin bán = Σ (tồn − giữ chỗ) các dòng chưa khóa. */
  abstract availabilityByListing(): Promise<Map<string, number>>;

  /** Mở dòng tồn của Farmery cho lô đã duyệt kèm một dòng sổ open_from_batch. Cùng lô gọi lại thì không làm gì. */
  abstract openFromBatch(input: OpenFromBatchInput, now: string): Promise<void>;

  /** Giữ chỗ cả đơn theo FEFO hoặc không gì cả (409 STOCK_CONFLICT). `ref` đã giữ chỗ trước đó cũng 409. */
  abstract reserve(ref: string, lines: StockLine[], now: string): Promise<Allocation[]>;

  /** Khép giữ chỗ của `ref`; không làm gì nếu giữ chỗ không còn ở trạng thái xuất phát của `kind`. */
  abstract settle(ref: string, kind: SettleKind, reason: string, now: string): Promise<void>;
}
