-- Chat RLS, Realtime broadcast trigger, backfill threads for existing bookings.
-- Apply with: pnpm db:migrate
-- Supabase Dashboard: Realtime → disable "Allow public access" for private channel RLS (see docs/env.md).

-- ---------------------------------------------------------------------------
-- Row Level Security: public.chat_threads, public.messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_threads_select_participant" ON public.chat_threads;
CREATE POLICY "chat_threads_select_participant"
  ON public.chat_threads
  FOR SELECT
  TO authenticated
  USING (
    customer_user_id = (SELECT auth.uid())
    OR vendor_user_id = (SELECT auth.uid())
  );

-- Writes go through Server Actions (Drizzle + DB role that bypasses RLS). No client INSERT/UPDATE.

DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_threads ct
      WHERE ct.id = messages.thread_id
        AND (
          ct.customer_user_id = (SELECT auth.uid())
          OR ct.vendor_user_id = (SELECT auth.uid())
        )
    )
    AND messages.deleted_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- Realtime Authorization: private Broadcast topics thread:{uuid}
-- Channel name must match trigger topic exactly. Client: private: true
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "realtime_broadcast_select_thread_participant" ON realtime.messages;
CREATE POLICY "realtime_broadcast_select_thread_participant"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.messages.extension = 'broadcast'
    AND EXISTS (
      SELECT 1
      FROM public.chat_threads ct
      WHERE ('thread:' || ct.id::text) = (SELECT realtime.topic())
        AND (
          ct.customer_user_id = (SELECT auth.uid())
          OR ct.vendor_user_id = (SELECT auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Broadcast from Database: notify subscribers on message insert/update/delete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.broadcast_chat_message_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  thread_uuid uuid;
BEGIN
  -- Skip broadcast for messages blocked by contact-leak detection
  IF TG_OP != 'DELETE' AND NEW.blocked_by_contact_rule = true THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    thread_uuid := OLD.thread_id;
  ELSE
    thread_uuid := NEW.thread_id;
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

DROP TRIGGER IF EXISTS broadcast_chat_messages_trigger ON public.messages;
CREATE TRIGGER broadcast_chat_messages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_chat_message_changes();

-- ---------------------------------------------------------------------------
-- Backfill: one chat thread per booking that is missing one; seed first message
-- ---------------------------------------------------------------------------
INSERT INTO public.chat_threads (
  booking_id,
  customer_user_id,
  vendor_user_id,
  created_at
)
SELECT
  b.id,
  b.customer_user_id,
  b.vendor_user_id,
  b.created_at
FROM public.bookings b
LEFT JOIN public.chat_threads ct ON ct.booking_id = b.id
WHERE ct.id IS NULL;

INSERT INTO public.messages (
  thread_id,
  sender_id,
  content,
  created_at
)
SELECT
  ct.id,
  b.customer_user_id,
  'Booking request'
    || E'\nPickup: ' || b.pickup_address
    || E'\nDrop-off: ' || b.dropoff_address
    || E'\nDrive: ' || b.drive_type::text
    || CASE
         WHEN b.distance_km IS NOT NULL
         THEN E'\nDistance: ' || trim(b.distance_km::text) || ' km'
         ELSE ''
       END,
  b.created_at
FROM public.chat_threads ct
INNER JOIN public.bookings b ON b.id = ct.booking_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.messages m WHERE m.thread_id = ct.id
);

UPDATE public.chat_threads ct
SET last_message_at = (
  SELECT max(m.created_at)
  FROM public.messages m
  WHERE m.thread_id = ct.id
)
WHERE ct.last_message_at IS NULL
  AND EXISTS (SELECT 1 FROM public.messages m WHERE m.thread_id = ct.id);
