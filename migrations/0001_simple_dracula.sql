CREATE TABLE "generated_iq_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"assigned_to" text NOT NULL,
	"assigned_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "generated_iq_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "iq_codes" ADD COLUMN "assigned_by" text;