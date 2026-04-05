CREATE TABLE "chat_thread_participant_read_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_thread_participant_read_state" ADD CONSTRAINT "chat_thread_participant_read_state_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_participant_read_state" ADD CONSTRAINT "chat_thread_participant_read_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_participant_read_thread_user_unique" ON "chat_thread_participant_read_state" USING btree ("thread_id","user_id");--> statement-breakpoint
CREATE INDEX "chat_participant_read_user_idx" ON "chat_thread_participant_read_state" USING btree ("user_id");

ALTER TABLE public.chat_thread_participant_read_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_state_select_own_participant" ON public.chat_thread_participant_read_state;
CREATE POLICY "chat_read_state_select_own_participant"
  ON public.chat_thread_participant_read_state
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_thread_participant_read_state.thread_id
        AND (
          ct.customer_user_id = (SELECT auth.uid())
          OR ct.vendor_user_id = (SELECT auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "chat_read_state_insert_own_participant" ON public.chat_thread_participant_read_state;
CREATE POLICY "chat_read_state_insert_own_participant"
  ON public.chat_thread_participant_read_state
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_thread_participant_read_state.thread_id
        AND (
          ct.customer_user_id = (SELECT auth.uid())
          OR ct.vendor_user_id = (SELECT auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "chat_read_state_update_own_participant" ON public.chat_thread_participant_read_state;
CREATE POLICY "chat_read_state_update_own_participant"
  ON public.chat_thread_participant_read_state
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_thread_participant_read_state.thread_id
        AND (
          ct.customer_user_id = (SELECT auth.uid())
          OR ct.vendor_user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );