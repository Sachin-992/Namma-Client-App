-- ==========================================
-- NAMMA CLIENT SUPABASE STORAGE SETUP MIGRATION
-- ==========================================
-- Step 1: Run this query in your Supabase SQL Editor to initialize the buckets.
-- Step 2: Configure RLS policies via the Supabase Storage Dashboard UI.

-- 1. INITIALIZE STORAGE BUCKETS (Run this in the SQL Editor)
-- ==========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('client-documents', 'client-documents', false, 20971520),     -- 20MB
  ('project-files', 'project-files', false, 104857600),           -- 100MB
  ('client-assets', 'client-assets', true, 10485760),             -- 10MB (Public for Logos)
  ('invoices', 'invoices', false, 20971520),                       -- 20MB
  ('requirements', 'requirements', false, 20971520),               -- 20MB
  ('notes-attachments', 'notes-attachments', false, 20971520),     -- 20MB
  ('media', 'media', false, 104857600)                             -- 100MB
ON CONFLICT (id) DO NOTHING;

-- 2. POLICIES SETUP INSTRUCTIONS
-- ==========================================
-- Because storage.objects is owned by the supabase_admin system user, Postgres restricts direct DDL/RLS changes
-- via the standard SQL Editor. Instead, configure policies using the Supabase Storage dashboard interface:
--
-- Go to: Supabase Dashboard -> Storage -> Policies
--
-- Create these policies for the buckets:
--
-- [ For 'client-assets' (Public) ]:
--   - Policy 1: "Public Read Access" -> ALLOW SELECT for 'public'
--   - Policy 2: "Authenticated Upload" -> ALLOW INSERT/UPDATE for 'authenticated'
--   - Policy 3: "Authenticated Delete" -> ALLOW DELETE for 'authenticated'
--
-- [ For Private Buckets ('client-documents', 'project-files', 'invoices', 'requirements', 'notes-attachments', 'media') ]:
--   - Select RLS Policy template "Allow authenticated access" or add a custom policy:
--     - ALLOW SELECT, INSERT, UPDATE, DELETE for 'authenticated' users.

