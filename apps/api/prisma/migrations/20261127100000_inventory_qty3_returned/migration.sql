-- Số lượng tồn kho 3 chữ số thập phân (khớp round3 của mã và giỏ hàng tối thiểu 0,001); thêm trạng thái giữ chỗ "returned" (hoàn tồn sau khi đã trừ).
ALTER TYPE "inventory"."reservation_status" ADD VALUE IF NOT EXISTS 'returned';

ALTER TABLE "inventory"."stock_holdings"
  ALTER COLUMN "qty_on_hand" TYPE DECIMAL(12,3),
  ALTER COLUMN "qty_reserved" TYPE DECIMAL(12,3);

ALTER TABLE "inventory"."stock_movements" ALTER COLUMN "quantity" TYPE DECIMAL(12,3);

ALTER TABLE "inventory"."reservations" ALTER COLUMN "quantity" TYPE DECIMAL(12,3);
