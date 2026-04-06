ALTER TABLE "message_reactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "message_reactions" CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" text DEFAULT 'TEXT' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "audio_duration" integer;