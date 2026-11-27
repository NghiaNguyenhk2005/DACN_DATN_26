ALTER TYPE "payment"."payment_status" ADD VALUE 'expired';

CREATE UNIQUE INDEX "payments_source_type_source_id_key"
    ON "payment"."payments"("source_type", "source_id");

ALTER TABLE "payment"."refunds" ALTER COLUMN "requested_by" DROP NOT NULL;
