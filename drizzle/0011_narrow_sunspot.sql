ALTER TABLE "booking_offers" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_offer_id_booking_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."booking_offers"("id") ON DELETE no action ON UPDATE no action;