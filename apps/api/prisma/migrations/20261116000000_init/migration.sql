-- Tiện ích PostgreSQL (Prisma không khai báo extension trong schema)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() không IMMUTABLE nên không dùng trực tiếp trong chỉ mục; bọc lại cho tìm từ khóa bỏ dấu (FR4.5, FR12.3)
CREATE FUNCTION public.f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "engagement";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "fulfillment";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "media";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "operations";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payment";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "procurement";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "retail";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "supplier";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "wholesale";

-- CreateEnum
CREATE TYPE "catalog"."product_group" AS ENUM ('leafy_veg', 'root_fruit', 'dry_goods');

-- CreateEnum
CREATE TYPE "catalog"."review_status" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'hidden');

-- CreateEnum
CREATE TYPE "engagement"."moderation_status" AS ENUM ('published', 'flagged', 'hidden');

-- CreateEnum
CREATE TYPE "fulfillment"."trip_status" AS ENUM ('planned', 'loading', 'departed', 'handed_over', 'cancelled');

-- CreateEnum
CREATE TYPE "fulfillment"."shipment_status" AS ENUM ('created', 'picked_up', 'delivering', 'delivered', 'failed', 'returned');

-- CreateEnum
CREATE TYPE "fulfillment"."request_type" AS ENUM ('quality', 'wrong_or_missing', 'change_of_mind', 'refused_at_door');

-- CreateEnum
CREATE TYPE "fulfillment"."cause" AS ENUM ('supply', 'packing', 'transport', 'recipient');

-- CreateEnum
CREATE TYPE "fulfillment"."decision" AS ENUM ('full_refund', 'partial_refund', 'replacement', 'rejected');

-- CreateEnum
CREATE TYPE "identity"."account_status" AS ENUM ('pending', 'active', 'locked', 'closed');

-- CreateEnum
CREATE TYPE "identity"."role_code" AS ENUM ('buyer_retail', 'buyer_wholesale', 'seller', 'staff_moderation', 'staff_operations', 'staff_sourcing', 'staff_warehouse', 'staff_support', 'platform_owner');

-- CreateEnum
CREATE TYPE "identity"."verification_status" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "identity"."otp_purpose" AS ENUM ('register', 'reset_password', 'sensitive_action', 'contract_confirm');

-- CreateEnum
CREATE TYPE "identity"."data_request_type" AS ENUM ('export', 'rectify', 'erase');

-- CreateEnum
CREATE TYPE "identity"."request_status" AS ENUM ('received', 'processing', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "inventory"."owner_type" AS ENUM ('supplier', 'farmery');

-- CreateEnum
CREATE TYPE "inventory"."location_type" AS ENUM ('supplier_site', 'farmery_warehouse');

-- CreateEnum
CREATE TYPE "inventory"."movement_type" AS ENUM ('open_from_batch', 'ownership_transfer', 'return_in', 'reserve', 'release', 'retail_out', 'wholesale_out', 'write_off', 'packing', 'refund_offset', 'recall_lock', 'stocktake_adjust');

-- CreateEnum
CREATE TYPE "inventory"."reservation_status" AS ENUM ('active', 'consumed', 'released', 'expired');

-- CreateEnum
CREATE TYPE "media"."access_level" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "media"."file_status" AS ENUM ('pending_upload', 'ready', 'rejected', 'deleted');

-- CreateEnum
CREATE TYPE "notification"."channel" AS ENUM ('in_app', 'push', 'email', 'sms');

-- CreateEnum
CREATE TYPE "operations"."task_type" AS ENUM ('supplier_profile', 'certification', 'product', 'batch', 'flagged_review', 'product_report');

-- CreateEnum
CREATE TYPE "operations"."task_status" AS ENUM ('open', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "operations"."sanction" AS ENUM ('reminder', 'warning', 'hide_listing', 'suspend', 'ban');

-- CreateEnum
CREATE TYPE "payment"."payment_method" AS ENUM ('cod', 'vietqr', 'card', 'e_wallet');

-- CreateEnum
CREATE TYPE "payment"."payment_status" AS ENUM ('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "payment"."invoice_kind" AS ENUM ('retail_sale', 'commission_service');

-- CreateEnum
CREATE TYPE "procurement"."offer_status" AS ENUM ('open', 'accepted', 'withdrawn', 'expired');

-- CreateEnum
CREATE TYPE "procurement"."po_status" AS ENUM ('draft', 'sent', 'supplier_confirmed', 'receiving', 'completed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "procurement"."inspection_result" AS ENUM ('accepted', 'partially_accepted', 'rejected');

-- CreateEnum
CREATE TYPE "retail"."listing_status" AS ENUM ('draft', 'active', 'paused', 'sold_out');

-- CreateEnum
CREATE TYPE "retail"."order_status" AS ENUM ('placed', 'paid', 'packing', 'on_trip', 'handed_to_3pl', 'delivering', 'delivered', 'completed', 'disputed', 'cancelled', 'returned');

-- CreateEnum
CREATE TYPE "retail"."payment_option" AS ENUM ('prepaid', 'cod');

-- CreateEnum
CREATE TYPE "retail"."restock_kind" AS ENUM ('back_in_stock', 'in_season');

-- CreateEnum
CREATE TYPE "supplier"."supplier_status" AS ENUM ('pending', 'active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "supplier"."seller_tax_type" AS ENUM ('self_producer', 'household_business', 'enterprise_coop');

-- CreateEnum
CREATE TYPE "supplier"."cert_type" AS ENUM ('VietGAP', 'GlobalGAP', 'organic', 'OCOP', 'HACCP');

-- CreateEnum
CREATE TYPE "supplier"."approval_status" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "wholesale"."rfq_status" AS ENUM ('open', 'negotiating', 'agreed', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "wholesale"."contract_status" AS ENUM ('draft', 'awaiting_confirmation', 'concluded', 'delivered', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "wholesale"."party" AS ENUM ('buyer', 'supplier');

-- CreateTable
CREATE TABLE "catalog"."categories" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "name" VARCHAR NOT NULL,
    "is_leaf" BOOLEAN NOT NULL DEFAULT false,
    "product_group" "catalog"."product_group",
    "allowed_units" VARCHAR[],
    "required_fields" JSONB,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."products" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "unit" VARCHAR NOT NULL,
    "image_ids" BIGINT[],
    "reference_retail_price" DECIMAL(14,2),
    "tax_group" VARCHAR,
    "seasonality" VARCHAR,
    "search_tsv" tsvector,
    "status" "catalog"."review_status" NOT NULL DEFAULT 'draft',
    "reviewed_by" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."batches" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "batch_code" VARCHAR NOT NULL,
    "harvest_date" DATE NOT NULL,
    "best_before" DATE NOT NULL,
    "declared_quantity" DECIMAL(12,2) NOT NULL,
    "qr_token" VARCHAR NOT NULL,
    "status" "catalog"."review_status" NOT NULL DEFAULT 'pending_review',
    "approved_by" BIGINT,
    "approved_at" TIMESTAMP(6),
    "recalled_at" TIMESTAMP(6),

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."farming_logs" (
    "id" BIGSERIAL NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "activity_date" DATE NOT NULL,
    "activity" VARCHAR NOT NULL,
    "description" TEXT,
    "image_ids" BIGINT[],
    "published_at" TIMESTAMP(6),
    "supersedes_id" BIGINT,
    "entered_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farming_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."product_embeddings" (
    "product_id" BIGINT NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "model_version" VARCHAR NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_embeddings_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "engagement"."reviews" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "buyer_user_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "content" TEXT,
    "image_ids" BIGINT[],
    "status" "engagement"."moderation_status" NOT NULL DEFAULT 'published',
    "flag_reasons" JSONB,
    "moderated_by" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement"."review_replies" (
    "review_id" BIGINT NOT NULL,
    "responder_user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "engagement"."supplier_reputation" (
    "supplier_id" BIGINT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "valid_review_count" INTEGER NOT NULL,
    "computed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_reputation_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "engagement"."wishlist_items" (
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("user_id","product_id")
);

-- CreateTable
CREATE TABLE "fulfillment"."transfer_trips" (
    "id" BIGSERIAL NOT NULL,
    "trip_code" VARCHAR NOT NULL,
    "trip_date" DATE NOT NULL,
    "vehicle_plate" VARCHAR,
    "carrier_name" VARCHAR,
    "status" "fulfillment"."trip_status" NOT NULL DEFAULT 'planned',
    "departed_at" TIMESTAMP(6),
    "handed_over_at" TIMESTAMP(6),
    "created_by" BIGINT NOT NULL,

    CONSTRAINT "transfer_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment"."trip_orders" (
    "trip_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "loaded_at" TIMESTAMP(6),

    CONSTRAINT "trip_orders_pkey" PRIMARY KEY ("trip_id","order_id")
);

-- CreateTable
CREATE TABLE "fulfillment"."shipments" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "trip_id" BIGINT,
    "carrier" VARCHAR NOT NULL DEFAULT 'internal',
    "carrier_order_code" VARCHAR,
    "carrier_fee" DECIMAL(14,2) NOT NULL,
    "middle_leg_fee" DECIMAL(14,2) NOT NULL,
    "slot_start" TIMESTAMP(6) NOT NULL,
    "slot_end" TIMESTAMP(6) NOT NULL,
    "status" "fulfillment"."shipment_status" NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment"."shipment_events" (
    "id" BIGSERIAL NOT NULL,
    "shipment_id" BIGINT NOT NULL,
    "status" "fulfillment"."shipment_status" NOT NULL,
    "carrier_event_id" VARCHAR,
    "payload" JSONB,
    "occurred_at" TIMESTAMP(6) NOT NULL,
    "received_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment"."return_requests" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "buyer_user_id" BIGINT NOT NULL,
    "request_type" "fulfillment"."request_type" NOT NULL,
    "claim_deadline" TIMESTAMP(6) NOT NULL,
    "description" TEXT,
    "evidence_ids" BIGINT[],
    "claimed_amount" DECIMAL(14,2) NOT NULL,
    "suggested_cause" "fulfillment"."cause",
    "cause" "fulfillment"."cause",
    "decision" "fulfillment"."decision",
    "refund_amount" DECIMAL(14,2),
    "return_required" BOOLEAN,
    "priority" VARCHAR NOT NULL DEFAULT 'normal',
    "due_at" TIMESTAMP(6) NOT NULL,
    "handled_by" BIGINT,
    "status" VARCHAR NOT NULL DEFAULT 'received',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(6),

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment"."messages" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "return_request_id" BIGINT,
    "sender_user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment_ids" BIGINT[],
    "sent_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(6),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "phone" VARCHAR,
    "email_verified_at" TIMESTAMP(6),
    "phone_verified_at" TIMESTAMP(6),
    "password_hash" VARCHAR,
    "oauth_provider" VARCHAR,
    "oauth_subject" VARCHAR,
    "totp_secret_enc" VARCHAR,
    "status" "identity"."account_status" NOT NULL DEFAULT 'pending',
    "locked_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_roles" (
    "user_id" BIGINT NOT NULL,
    "role" "identity"."role_code" NOT NULL,
    "granted_by" BIGINT,
    "granted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "identity"."otp_challenges" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "purpose" "identity"."otp_purpose" NOT NULL,
    "channel" VARCHAR NOT NULL,
    "code_hash" VARCHAR NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "consumed_at" TIMESTAMP(6),

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."addresses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "label" VARCHAR,
    "recipient_name" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "address_line" VARCHAR NOT NULL,
    "ward" VARCHAR NOT NULL,
    "province" VARCHAR NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."businesses" (
    "id" BIGSERIAL NOT NULL,
    "owner_user_id" BIGINT NOT NULL,
    "company_name" VARCHAR NOT NULL,
    "tax_code" VARCHAR NOT NULL,
    "license_file_id" BIGINT NOT NULL,
    "verification_status" "identity"."verification_status" NOT NULL DEFAULT 'pending',
    "verified_by" BIGINT,
    "verified_at" TIMESTAMP(6),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."ekyc_documents" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "document_type" VARCHAR NOT NULL,
    "front_file_id" BIGINT NOT NULL,
    "back_file_id" BIGINT,
    "selfie_file_id" BIGINT NOT NULL,
    "status" "identity"."verification_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMP(6),
    "rejection_reason" TEXT,

    CONSTRAINT "ekyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."consent_records" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "policy_type" VARCHAR NOT NULL,
    "policy_version" VARCHAR NOT NULL,
    "accepted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."data_requests" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "request_type" "identity"."data_request_type" NOT NULL,
    "status" "identity"."request_status" NOT NULL DEFAULT 'received',
    "requested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(6) NOT NULL,
    "retained_note" TEXT,
    "handled_by" BIGINT,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_holdings" (
    "id" BIGSERIAL NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "owner_type" "inventory"."owner_type" NOT NULL,
    "owner_supplier_id" BIGINT,
    "location_type" "inventory"."location_type" NOT NULL,
    "warehouse_code" VARCHAR,
    "sale_unit" VARCHAR NOT NULL,
    "qty_on_hand" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "qty_reserved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_movements" (
    "id" BIGSERIAL NOT NULL,
    "holding_id" BIGINT NOT NULL,
    "movement_type" "inventory"."movement_type" NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "counter_holding_id" BIGINT,
    "source_type" VARCHAR NOT NULL,
    "source_id" BIGINT NOT NULL,
    "performed_by" BIGINT,
    "reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."reservations" (
    "id" BIGSERIAL NOT NULL,
    "holding_id" BIGINT NOT NULL,
    "source_type" VARCHAR NOT NULL,
    "source_id" BIGINT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "status" "inventory"."reservation_status" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."packing_runs" (
    "id" BIGSERIAL NOT NULL,
    "source_holding_id" BIGINT NOT NULL,
    "output_holding_id" BIGINT NOT NULL,
    "input_qty" DECIMAL(12,2) NOT NULL,
    "output_units" INTEGER NOT NULL,
    "shrinkage_qty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "label_data" JSONB NOT NULL,
    "packed_by" BIGINT NOT NULL,
    "packed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."batch_recalls" (
    "id" BIGSERIAL NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "initiated_by" BIGINT NOT NULL,
    "affected_orders" JSONB,
    "initiated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(6),

    CONSTRAINT "batch_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."media_files" (
    "id" BIGSERIAL NOT NULL,
    "owner_user_id" BIGINT NOT NULL,
    "bucket" VARCHAR NOT NULL,
    "object_key" VARCHAR NOT NULL,
    "mime_type" VARCHAR NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" VARCHAR NOT NULL,
    "access_level" "media"."access_level" NOT NULL,
    "status" "media"."file_status" NOT NULL DEFAULT 'pending_upload',
    "variants" JSONB,
    "retain_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "event_type" VARCHAR NOT NULL,
    "title" VARCHAR NOT NULL,
    "body" TEXT NOT NULL,
    "link_target" VARCHAR,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."deliveries" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "channel" "notification"."channel" NOT NULL,
    "status" VARCHAR NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(6),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."preferences" (
    "user_id" BIGINT NOT NULL,
    "event_group" VARCHAR NOT NULL,
    "channel" "notification"."channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("user_id","event_group","channel")
);

-- CreateTable
CREATE TABLE "notification"."push_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "endpoint" VARCHAR NOT NULL,
    "p256dh" VARCHAR NOT NULL,
    "auth_secret" VARCHAR NOT NULL,
    "user_agent" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(6),

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."platform_settings" (
    "key" VARCHAR NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" BIGINT NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "operations"."review_tasks" (
    "id" BIGSERIAL NOT NULL,
    "task_type" "operations"."task_type" NOT NULL,
    "target_id" BIGINT NOT NULL,
    "reporter_user_id" BIGINT,
    "status" "operations"."task_status" NOT NULL DEFAULT 'open',
    "assigned_to" BIGINT,
    "due_at" TIMESTAMP(6),
    "decision_reason" TEXT,
    "decided_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."violation_records" (
    "id" BIGSERIAL NOT NULL,
    "subject_type" VARCHAR NOT NULL,
    "subject_id" BIGINT NOT NULL,
    "review_task_id" BIGINT,
    "violation_type" VARCHAR NOT NULL,
    "sanction" "operations"."sanction" NOT NULL,
    "effective_at" TIMESTAMP(6) NOT NULL,
    "reason" TEXT NOT NULL,
    "decided_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."threshold_alerts" (
    "id" BIGSERIAL NOT NULL,
    "rule_key" VARCHAR NOT NULL,
    "target_type" VARCHAR NOT NULL,
    "target_id" BIGINT NOT NULL,
    "observed_value" DECIMAL(14,4) NOT NULL,
    "threshold_value" DECIMAL(14,4) NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'open',
    "acknowledged_by" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threshold_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."staff_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "staff_user_id" BIGINT NOT NULL,
    "role" VARCHAR NOT NULL,
    "action" VARCHAR NOT NULL,
    "target_schema" VARCHAR NOT NULL,
    "target_table" VARCHAR NOT NULL,
    "target_id" VARCHAR NOT NULL,
    "on_behalf_of_supplier_id" BIGINT,
    "before_state" JSONB,
    "after_state" JSONB,
    "reason" TEXT,
    "ip_address" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment"."payments" (
    "id" BIGSERIAL NOT NULL,
    "source_type" VARCHAR NOT NULL,
    "source_id" BIGINT NOT NULL,
    "method" "payment"."payment_method" NOT NULL,
    "gateway" VARCHAR,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "payment"."payment_status" NOT NULL DEFAULT 'pending',
    "gateway_txn_ref" VARCHAR,
    "paid_at" TIMESTAMP(6),
    "escrow_status" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment"."refunds" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "return_request_id" BIGINT,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "payment"."payment_status" NOT NULL DEFAULT 'pending',
    "gateway_refund_ref" VARCHAR,
    "requested_by" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment"."invoices" (
    "id" BIGSERIAL NOT NULL,
    "kind" "payment"."invoice_kind" NOT NULL,
    "source_type" VARCHAR NOT NULL,
    "source_id" BIGINT NOT NULL,
    "buyer_name" VARCHAR NOT NULL,
    "buyer_tax_code" VARCHAR,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "tax_amount" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "lookup_code" VARCHAR NOT NULL,
    "pdf_file_id" BIGINT,
    "provider" VARCHAR NOT NULL DEFAULT 'mock',
    "issued_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment"."commission_settlements" (
    "id" BIGSERIAL NOT NULL,
    "wholesale_order_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "commission_amount" DECIMAL(14,2) NOT NULL,
    "withholding_rate" DECIMAL(5,4),
    "withholding_amount" DECIMAL(14,2),
    "service_invoice_id" BIGINT,
    "settled_at" TIMESTAMP(6),

    CONSTRAINT "commission_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment"."supplier_payouts" (
    "id" BIGSERIAL NOT NULL,
    "purchase_order_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "payment"."payment_status" NOT NULL DEFAULT 'pending',
    "bank_reference" VARCHAR,
    "paid_at" TIMESTAMP(6),

    CONSTRAINT "supplier_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement"."supplier_offers" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "offered_qty" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "expected_harvest" DATE NOT NULL,
    "status" "procurement"."offer_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement"."purchase_orders" (
    "id" BIGSERIAL NOT NULL,
    "offer_id" BIGINT,
    "supplier_id" BIGINT NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "ordered_qty" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "delivery_due" DATE NOT NULL,
    "status" "procurement"."po_status" NOT NULL DEFAULT 'draft',
    "confirm_deadline" TIMESTAMP(6) NOT NULL,
    "supplier_confirmed_at" TIMESTAMP(6),
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement"."goods_receipts" (
    "id" BIGSERIAL NOT NULL,
    "purchase_order_id" BIGINT NOT NULL,
    "accepted_qty" DECIMAL(12,2) NOT NULL,
    "rejected_qty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shrinkage_qty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjusted_unit_price" DECIMAL(14,2),
    "result" "procurement"."inspection_result" NOT NULL,
    "note" TEXT,
    "image_ids" BIGINT[],
    "target_holding_id" BIGINT,
    "inspected_by" BIGINT NOT NULL,
    "inspected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement"."price_forecasts" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "region" VARCHAR NOT NULL,
    "week_start" DATE NOT NULL,
    "predicted_price" DECIMAL(14,2) NOT NULL,
    "lower_bound" DECIMAL(14,2) NOT NULL,
    "upper_bound" DECIMAL(14,2) NOT NULL,
    "model_name" VARCHAR NOT NULL,
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."listings" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sale_unit" VARCHAR NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "status" "retail"."listing_status" NOT NULL DEFAULT 'draft',
    "priced_by" BIGINT NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."vouchers" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "max_discount" DECIMAL(14,2),
    "min_order_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(6) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."carts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."cart_items" (
    "cart_id" BIGINT NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_id","listing_id")
);

-- CreateTable
CREATE TABLE "retail"."orders" (
    "id" BIGSERIAL NOT NULL,
    "order_code" VARCHAR NOT NULL,
    "buyer_user_id" BIGINT NOT NULL,
    "address_snapshot" JSONB NOT NULL,
    "delivery_date" DATE NOT NULL,
    "delivery_slot" VARCHAR NOT NULL,
    "payment_option" "retail"."payment_option" NOT NULL,
    "voucher_id" BIGINT,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "status" "retail"."order_status" NOT NULL DEFAULT 'placed',
    "reserve_expires_at" TIMESTAMP(6),
    "cod_refused_at" TIMESTAMP(6),
    "reorder_of" BIGINT,
    "placed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "holding_id" BIGINT NOT NULL,
    "batch_id" BIGINT NOT NULL,
    "product_name" VARCHAR NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."order_status_events" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "to_status" "retail"."order_status" NOT NULL,
    "source" VARCHAR NOT NULL,
    "actor_user_id" BIGINT,
    "note" TEXT,
    "occurred_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retail"."restock_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "kind" "retail"."restock_kind" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(6),

    CONSTRAINT "restock_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier"."suppliers" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "display_name" VARCHAR NOT NULL,
    "description" TEXT,
    "avatar_file_id" BIGINT,
    "growing_region" VARCHAR NOT NULL,
    "growing_area_code" VARCHAR,
    "area_checked_by" BIGINT,
    "tax_type" "supplier"."seller_tax_type" NOT NULL,
    "tax_code" VARCHAR,
    "tax_confirmed_by" BIGINT,
    "status" "supplier"."supplier_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier"."certifications" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "type" "supplier"."cert_type" NOT NULL,
    "certificate_number" VARCHAR NOT NULL,
    "issuing_authority" VARCHAR NOT NULL,
    "evidence_file_id" BIGINT NOT NULL,
    "issued_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "approval_status" "supplier"."approval_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMP(6),
    "supersedes_id" BIGINT,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier"."support_assignments" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "staff_user_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(6),

    CONSTRAINT "support_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale"."price_tiers" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "min_qty" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "lead_time_days" INTEGER,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale"."rfqs" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "requested_qty" DECIMAL(12,2) NOT NULL,
    "quality_standard" VARCHAR,
    "desired_delivery" DATE NOT NULL,
    "status" "wholesale"."rfq_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale"."rfq_messages" (
    "id" BIGSERIAL NOT NULL,
    "rfq_id" BIGINT NOT NULL,
    "sender_user_id" BIGINT NOT NULL,
    "is_quote" BOOLEAN NOT NULL DEFAULT false,
    "proposed_qty" DECIMAL(12,2),
    "proposed_price" DECIMAL(14,2),
    "proposed_delivery" DATE,
    "content" TEXT,
    "attachment_ids" BIGINT[],
    "sent_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale"."contracts" (
    "id" BIGSERIAL NOT NULL,
    "rfq_id" BIGINT NOT NULL,
    "contract_code" VARCHAR NOT NULL,
    "agreed_qty" DECIMAL(12,2) NOT NULL,
    "agreed_unit_price" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "delivery_date" DATE NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "status" "wholesale"."contract_status" NOT NULL DEFAULT 'draft',
    "concluded_at" TIMESTAMP(6),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale"."contract_versions" (
    "contract_id" BIGINT NOT NULL,
    "version" INTEGER NOT NULL,
    "document_file_id" BIGINT NOT NULL,
    "document_hash" VARCHAR NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("contract_id","version")
);

-- CreateTable
CREATE TABLE "wholesale"."contract_confirmations" (
    "contract_id" BIGINT NOT NULL,
    "party" "wholesale"."party" NOT NULL,
    "version" INTEGER NOT NULL,
    "document_hash" VARCHAR NOT NULL,
    "user_id" BIGINT NOT NULL,
    "otp_challenge_id" BIGINT NOT NULL,
    "confirmed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_confirmations_pkey" PRIMARY KEY ("contract_id","party")
);

-- CreateTable
CREATE TABLE "wholesale"."wholesale_orders" (
    "id" BIGSERIAL NOT NULL,
    "contract_id" BIGINT NOT NULL,
    "holding_id" BIGINT NOT NULL,
    "shipped_at" TIMESTAMP(6),
    "received_at" TIMESTAMP(6),
    "rejected_qty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR NOT NULL DEFAULT 'awaiting_delivery',

    CONSTRAINT "wholesale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_code_key" ON "catalog"."batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "batches_qr_token_key" ON "catalog"."batches"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_item_id_key" ON "engagement"."reviews"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_trips_trip_code_key" ON "fulfillment"."transfer_trips"("trip_code");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "fulfillment"."shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_carrier_order_code_key" ON "fulfillment"."shipments"("carrier_order_code");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_events_carrier_event_id_key" ON "fulfillment"."shipment_events"("carrier_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "identity"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_owner_user_id_key" ON "identity"."businesses"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_tax_code_key" ON "identity"."businesses"("tax_code");

-- CreateIndex
CREATE UNIQUE INDEX "batch_recalls_batch_id_key" ON "inventory"."batch_recalls"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_object_key_key" ON "media"."media_files"("object_key");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "notification"."push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_txn_ref_key" ON "payment"."payments"("gateway_txn_ref");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_lookup_code_key" ON "payment"."invoices"("lookup_code");

-- CreateIndex
CREATE UNIQUE INDEX "commission_settlements_wholesale_order_id_key" ON "payment"."commission_settlements"("wholesale_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_payouts_purchase_order_id_key" ON "payment"."supplier_payouts"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_forecasts_category_id_region_week_start_model_name_key" ON "procurement"."price_forecasts"("category_id", "region", "week_start", "model_name");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "retail"."vouchers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "retail"."carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "retail"."orders"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "restock_subscriptions_user_id_product_id_kind_key" ON "retail"."restock_subscriptions"("user_id", "product_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_user_id_key" ON "supplier"."suppliers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_rfq_id_key" ON "wholesale"."contracts"("rfq_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_code_key" ON "wholesale"."contracts"("contract_code");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_orders_contract_id_key" ON "wholesale"."wholesale_orders"("contract_id");

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."batches" ADD CONSTRAINT "batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."farming_logs" ADD CONSTRAINT "farming_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "catalog"."batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."farming_logs" ADD CONSTRAINT "farming_logs_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "catalog"."farming_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_embeddings" ADD CONSTRAINT "product_embeddings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement"."review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "engagement"."reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment"."trip_orders" ADD CONSTRAINT "trip_orders_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "fulfillment"."transfer_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment"."shipments" ADD CONSTRAINT "shipments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "fulfillment"."transfer_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment"."shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "fulfillment"."shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment"."messages" ADD CONSTRAINT "messages_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "fulfillment"."return_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."businesses" ADD CONSTRAINT "businesses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."businesses" ADD CONSTRAINT "businesses_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."ekyc_documents" ADD CONSTRAINT "ekyc_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."ekyc_documents" ADD CONSTRAINT "ekyc_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."data_requests" ADD CONSTRAINT "data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."data_requests" ADD CONSTRAINT "data_requests_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "inventory"."stock_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_counter_holding_id_fkey" FOREIGN KEY ("counter_holding_id") REFERENCES "inventory"."stock_holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."reservations" ADD CONSTRAINT "reservations_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "inventory"."stock_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."packing_runs" ADD CONSTRAINT "packing_runs_source_holding_id_fkey" FOREIGN KEY ("source_holding_id") REFERENCES "inventory"."stock_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."packing_runs" ADD CONSTRAINT "packing_runs_output_holding_id_fkey" FOREIGN KEY ("output_holding_id") REFERENCES "inventory"."stock_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."deliveries" ADD CONSTRAINT "deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification"."notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."violation_records" ADD CONSTRAINT "violation_records_review_task_id_fkey" FOREIGN KEY ("review_task_id") REFERENCES "operations"."review_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment"."refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment"."commission_settlements" ADD CONSTRAINT "commission_settlements_service_invoice_id_fkey" FOREIGN KEY ("service_invoice_id") REFERENCES "payment"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement"."purchase_orders" ADD CONSTRAINT "purchase_orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "procurement"."supplier_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "procurement"."purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "retail"."carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."cart_items" ADD CONSTRAINT "cart_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "retail"."listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."orders" ADD CONSTRAINT "orders_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "retail"."vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."orders" ADD CONSTRAINT "orders_reorder_of_fkey" FOREIGN KEY ("reorder_of") REFERENCES "retail"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "retail"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."order_items" ADD CONSTRAINT "order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "retail"."listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retail"."order_status_events" ADD CONSTRAINT "order_status_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "retail"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier"."certifications" ADD CONSTRAINT "certifications_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier"."certifications" ADD CONSTRAINT "certifications_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "supplier"."certifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier"."support_assignments" ADD CONSTRAINT "support_assignments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale"."rfq_messages" ADD CONSTRAINT "rfq_messages_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "wholesale"."rfqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale"."contracts" ADD CONSTRAINT "contracts_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "wholesale"."rfqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale"."contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "wholesale"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale"."contract_confirmations" ADD CONSTRAINT "contract_confirmations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "wholesale"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale"."wholesale_orders" ADD CONSTRAINT "wholesale_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "wholesale"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Phần viết tay: chỉ mục và ràng buộc Prisma không biểu diễn được
-- ============================================================================

-- Tìm ngữ nghĩa: lân cận gần đúng theo cosine trên vector BGE-M3 (FR12.3, FR12.1)
CREATE INDEX "product_embeddings_embedding_hnsw_idx" ON "catalog"."product_embeddings"
  USING hnsw ("embedding" vector_cosine_ops);

-- Tìm từ khóa: trigram trên tên đã bỏ dấu + tìm toàn văn trên search_tsv (FR4.5)
CREATE INDEX "products_name_trgm_idx" ON "catalog"."products"
  USING gin (public.f_unaccent(lower("name")) gin_trgm_ops);
CREATE INDEX "products_search_tsv_idx" ON "catalog"."products" USING gin ("search_tsv");

CREATE FUNCTION "catalog".products_search_tsv_update() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW."search_tsv" := to_tsvector('simple', public.f_unaccent(coalesce(NEW."name", '') || ' ' || coalesce(NEW."description", '')));
  RETURN NEW;
END
$$;
CREATE TRIGGER products_search_tsv
  BEFORE INSERT OR UPDATE OF "name", "description" ON "catalog"."products"
  FOR EACH ROW EXECUTE FUNCTION "catalog".products_search_tsv_update();

-- Chống bán vượt ở tầng dữ liệu (NFR4.1): tồn và giữ chỗ không âm, giữ chỗ không vượt tồn
ALTER TABLE "inventory"."stock_holdings"
  ADD CONSTRAINT "stock_holdings_qty_check"
  CHECK ("qty_on_hand" >= 0 AND "qty_reserved" >= 0 AND "qty_reserved" <= "qty_on_hand");
