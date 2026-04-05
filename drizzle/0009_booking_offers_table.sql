CREATE TYPE "public"."booking_offer_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "booking_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"price_per_day" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"note" text,
	"status" "booking_offer_status" DEFAULT 'PENDING' NOT NULL,
	"responded_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_offers_booking_idx" ON "booking_offers" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_offers_status_idx" ON "booking_offers" USING btree ("status");