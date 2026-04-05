CREATE TABLE "message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "message_reactions_msg_user_unique" ON "message_reactions" USING btree ("message_id","user_id");
--> statement-breakpoint
CREATE INDEX "message_reactions_message_idx" ON "message_reactions" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "message_reactions_user_idx" ON "message_reactions" USING btree ("user_id)");
--> statement-breakpoint
-- RLS for message_reactions
ALTER TABLE "message_reactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Participants of the thread can see reactions
CREATE POLICY "message_reactions_participant_select" ON "message_reactions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = (
        SELECT thread_id FROM messages WHERE id = message_reactions.message_id
      )
      AND (chat_threads.customer_user_id = auth.uid() OR chat_threads.vendor_user_id = auth.uid())
    )
  );
--> statement-breakpoint
-- Participants can insert their own reactions
CREATE POLICY "message_reactions_participant_insert" ON "message_reactions"
  FOR INSERT WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
-- Participants can delete their own reactions
CREATE POLICY "message_reactions_participant_delete" ON "message_reactions"
  FOR DELETE USING (user_id = auth.uid());
--> statement-breakpoint
-- Broadcast reaction changes to the thread channel
CREATE OR REPLACE FUNCTION public.broadcast_reaction_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  thread_uuid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT thread_id INTO thread_uuid FROM messages WHERE id = OLD.message_id;
  ELSE
    SELECT thread_id INTO thread_uuid FROM messages WHERE id = NEW.message_id;
  END IF;

  PERFORM realtime.broadcast_changes(
    'thread:' || thread_uuid::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS broadcast_reaction_changes_trigger ON public.message_reactions;
CREATE TRIGGER broadcast_reaction_changes_trigger
  AFTER INSERT OR DELETE ON public.message_reactions
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_reaction_changes();
