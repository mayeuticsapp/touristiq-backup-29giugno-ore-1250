CREATE TABLE "accounting_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_code" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" text NOT NULL,
	"movement_date" text NOT NULL,
	"payment_method" text,
	"clients_served" integer,
	"iqcodes_used" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_code" text NOT NULL,
	"credits_remaining" integer DEFAULT 1000 NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"last_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_credits_admin_code_unique" UNIQUE("admin_code")
);
--> statement-breakpoint
CREATE TABLE "assigned_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_iq_code" text NOT NULL,
	"package_size" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"credits_remaining" integer NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "available_iq_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"structure_code" text NOT NULL,
	"original_guest_id" integer,
	"original_guest_name" text,
	"package_id" integer NOT NULL,
	"made_available_at" timestamp DEFAULT now() NOT NULL,
	"reason" text DEFAULT 'removed_from_guest',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "available_iq_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "generated_emotional_codes" (
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
	"assigned_at" timestamp,
	"removed_at" timestamp,
	"removed_reason" text,
	CONSTRAINT "generated_emotional_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_code" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"room_number" text,
	"checkin_date" text,
	"checkout_date" text,
	"notes" text,
	"assigned_codes" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iq_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"assigned_to" text,
	"location" text,
	"code_type" text,
	"approved_at" timestamp,
	"approved_by" text,
	"internal_note" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "iq_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "iqcode_recharges" (
	"id" serial PRIMARY KEY NOT NULL,
	"validation_id" integer NOT NULL,
	"tourist_iq_code" text NOT NULL,
	"status" text DEFAULT 'payment_pending' NOT NULL,
	"sumup_payment_id" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"activated_at" timestamp,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iqcode_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tourist_iq_code" text NOT NULL,
	"partner_code" text NOT NULL,
	"partner_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"uses_remaining" integer DEFAULT 10 NOT NULL,
	"uses_total" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_code" text NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"website" text,
	"opening_hours" text NOT NULL,
	"seasonal_hours" text,
	"wheelchair_accessible" boolean DEFAULT false NOT NULL,
	"ramp_width" text,
	"ramp_slope" text,
	"elevator_access" boolean DEFAULT false NOT NULL,
	"accessible_bathroom" boolean DEFAULT false NOT NULL,
	"parking_spaces" integer DEFAULT 0,
	"accessible_parking" integer DEFAULT 0,
	"assistance_available" boolean DEFAULT false NOT NULL,
	"accessibility_notes" text,
	"gluten_free" boolean DEFAULT false NOT NULL,
	"gluten_free_kitchen" boolean DEFAULT false NOT NULL,
	"dairy_free" boolean DEFAULT false NOT NULL,
	"nut_free" boolean DEFAULT false NOT NULL,
	"vegetarian_options" boolean DEFAULT false NOT NULL,
	"vegan_options" boolean DEFAULT false NOT NULL,
	"halal_certified" boolean DEFAULT false NOT NULL,
	"kosher_certified" boolean DEFAULT false NOT NULL,
	"allergy_training" boolean DEFAULT false NOT NULL,
	"allergy_menu" boolean DEFAULT false NOT NULL,
	"allergy_notes" text,
	"child_friendly" boolean DEFAULT false NOT NULL,
	"high_chairs" boolean DEFAULT false NOT NULL,
	"kids_menu" boolean DEFAULT false NOT NULL,
	"changing_table" boolean DEFAULT false NOT NULL,
	"play_area" boolean DEFAULT false NOT NULL,
	"baby_friendly" boolean DEFAULT false NOT NULL,
	"toddler_friendly" boolean DEFAULT false NOT NULL,
	"child_friendly_6plus" boolean DEFAULT false NOT NULL,
	"teen_friendly" boolean DEFAULT false NOT NULL,
	"family_packages" boolean DEFAULT false NOT NULL,
	"babysitting_service" boolean DEFAULT false NOT NULL,
	"family_notes" text,
	"unique_specialties" text,
	"local_traditions" text,
	"experience_types" text,
	"skill_levels" text,
	"equipment_provided" text,
	"languages_spoken" text,
	"certifications" text,
	"awards" text,
	"wifi_available" boolean DEFAULT false NOT NULL,
	"pets_allowed" boolean DEFAULT false NOT NULL,
	"smoking_allowed" boolean DEFAULT false NOT NULL,
	"credit_cards_accepted" boolean DEFAULT false NOT NULL,
	"delivery_service" boolean DEFAULT false NOT NULL,
	"takeaway_service" boolean DEFAULT false NOT NULL,
	"reservations_required" boolean DEFAULT false NOT NULL,
	"group_bookings" boolean DEFAULT false NOT NULL,
	"private_events" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_details_partner_code_unique" UNIQUE("partner_code")
);
--> statement-breakpoint
CREATE TABLE "partner_onboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_code" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"business_info_completed" boolean DEFAULT false NOT NULL,
	"accessibility_info_completed" boolean DEFAULT false NOT NULL,
	"allergy_info_completed" boolean DEFAULT false NOT NULL,
	"family_info_completed" boolean DEFAULT false NOT NULL,
	"specialty_info_completed" boolean DEFAULT false NOT NULL,
	"services_info_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_onboarding_partner_code_unique" UNIQUE("partner_code")
);
--> statement-breakpoint
CREATE TABLE "purchased_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_code" text NOT NULL,
	"package_size" integer NOT NULL,
	"price" text NOT NULL,
	"iq_codes_remaining" integer NOT NULL,
	"iq_codes_used" integer DEFAULT 0,
	"purchase_date" timestamp DEFAULT now(),
	"payment_method" text DEFAULT 'sumup',
	"payment_status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"iq_code" text NOT NULL,
	"role" text NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "settings_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_code" text NOT NULL,
	"structure_name" text DEFAULT '' NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"business_type" text DEFAULT 'hotel' NOT NULL,
	"checkin_time" text DEFAULT '15:00' NOT NULL,
	"checkout_time" text DEFAULT '11:00' NOT NULL,
	"max_guests_per_room" integer DEFAULT 4 NOT NULL,
	"welcome_message" text DEFAULT 'Benvenuto nella nostra struttura!' NOT NULL,
	"additional_services" text DEFAULT '' NOT NULL,
	"wifi_password" text DEFAULT '' NOT NULL,
	"emergency_contact" text DEFAULT '' NOT NULL,
	"tax_rate" text DEFAULT '3.00' NOT NULL,
	"default_currency" text DEFAULT 'EUR' NOT NULL,
	"language_preference" text DEFAULT 'it' NOT NULL,
	"notification_preferences" text DEFAULT '{}' NOT NULL,
	"backup_frequency" text DEFAULT 'daily' NOT NULL,
	"auto_logout_minutes" integer DEFAULT 30 NOT NULL,
	"enable_guest_portal" boolean DEFAULT true NOT NULL,
	"enable_whatsapp_integration" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_config_structure_code_unique" UNIQUE("structure_code")
);
--> statement-breakpoint
CREATE TABLE "structure_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_code" text NOT NULL,
	"gestionale_unlocked_at" timestamp DEFAULT now(),
	"first_package_purchase" timestamp,
	"is_gestionale_blocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "structure_settings_structure_code_unique" UNIQUE("structure_code")
);
