-- Dòng tồn chụp lại thông tin lô (sản phẩm, tin bán, mã lô, hạn dùng) để FEFO và gom theo tin bán làm thẳng bằng SQL.
-- Bảng chưa có dòng nào nên thêm cột NOT NULL không cần giá trị mặc định.
ALTER TABLE "inventory"."stock_holdings"
  ADD COLUMN "product_id" BIGINT NOT NULL,
  ADD COLUMN "listing_id" BIGINT NOT NULL,
  ADD COLUMN "batch_code" VARCHAR NOT NULL,
  ADD COLUMN "product_name" VARCHAR NOT NULL,
  ADD COLUMN "harvest_date" DATE NOT NULL,
  ADD COLUMN "best_before" DATE NOT NULL;

CREATE INDEX "stock_holdings_listing_id_idx" ON "inventory"."stock_holdings"("listing_id");
CREATE INDEX "stock_holdings_batch_id_idx" ON "inventory"."stock_holdings"("batch_id");
