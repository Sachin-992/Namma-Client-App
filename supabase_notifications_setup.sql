-- =============================================================
-- NAMMA CLIENT — NOTIFICATIONS TABLE SETUP
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,              -- e.g. 'client_added', 'invoice_paid', 'deadline_approaching'
  title       text NOT NULL,             -- Short headline: "Invoice Paid"
  message     text NOT NULL,             -- Full message: "INV-001 marked as paid by Admin"
  entity_type text,                      -- 'client' | 'project' | 'invoice' | 'document' | 'requirement'
  entity_id   text,                      -- UUID of the related entity (stored as text for flexibility)
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: users can only see & manage their own notifications
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications"
  ON public.notifications
  FOR ALL
  USING (user_id = auth.uid());

-- 4. Index for fast queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_org_id_idx ON public.notifications(org_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read) WHERE is_read = false;

-- 5. Enable Realtime on notifications table
-- Go to: Supabase Dashboard → Database → Replication → Tables → enable for 'notifications'
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================================
-- DONE! After running this, the notification bell in Namma
-- Client will show live notifications via Supabase Realtime.
-- =============================================================
