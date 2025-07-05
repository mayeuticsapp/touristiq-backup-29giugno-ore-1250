
CREATE TABLE "generated_iq_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"generated_by" text NOT NULL,
	"package_id" integer NOT NULL,
	"assigned_to" text,
	"guest_id" integer,
	"country" text NOT NULL,
	"emotional_word" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	CONSTRAINT "generated_iq_codes_code_unique" UNIQUE("code")
);
