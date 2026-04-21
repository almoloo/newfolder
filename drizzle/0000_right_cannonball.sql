ALTER TABLE "file" ADD COLUMN IF NOT EXISTS "size_bytes" text DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN IF NOT EXISTS "quoted_fee" text DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN IF NOT EXISTS "charged_fee" text DEFAULT '0' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_balance" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"available_amount" text DEFAULT '0' NOT NULL,
	"locked_amount" text DEFAULT '0' NOT NULL,
	"total_credited" text DEFAULT '0' NOT NULL,
	"total_debited" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"amount" text NOT NULL,
	"balance_before" text NOT NULL,
	"balance_after" text NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"transaction_key" text,
	"tx_hash" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topup" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"chain_id" text NOT NULL,
	"amount" text NOT NULL,
	"tx_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"block_number" text,
	"credited_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'credit_balance_user_id_user_id_fk'
	) THEN
		ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'credit_transaction_user_id_user_id_fk'
	) THEN
		ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'credit_transaction_balance_id_credit_balance_id_fk'
	) THEN
		ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_balance_id_credit_balance_id_fk" FOREIGN KEY ("balance_id") REFERENCES "public"."credit_balance"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'topup_user_id_user_id_fk'
	) THEN
		ALTER TABLE "topup" ADD CONSTRAINT "topup_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_balance_user_unique" ON "credit_balance" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_balance_user_id_idx" ON "credit_balance" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transaction_user_id_idx" ON "credit_transaction" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transaction_balance_id_idx" ON "credit_transaction" USING btree ("balance_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transaction_type_idx" ON "credit_transaction" USING btree ("type");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_transaction_key_unique" ON "credit_transaction" USING btree ("transaction_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_transaction_tx_hash_unique" ON "credit_transaction" USING btree ("tx_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topup_user_id_idx" ON "topup" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topup_wallet_address_idx" ON "topup" USING btree ("wallet_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topup_status_idx" ON "topup" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topup_tx_hash_unique" ON "topup" USING btree ("tx_hash");
