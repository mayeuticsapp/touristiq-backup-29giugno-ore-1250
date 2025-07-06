CREATE TABLE "partner_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"discount" text NOT NULL,
	"valid_until" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_code" text NOT NULL,
	"partner_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"discount_percentage" integer NOT NULL,
	"discount_type" text DEFAULT 'percentage',
	"category" text NOT NULL,
	"location" text,
	"city" text,
	"province" text,
	"latitude" text,
	"longitude" text,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"target_audience" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
