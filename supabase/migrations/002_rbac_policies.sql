-- ============================================================
-- Namma Client — RBAC & RLS Database Policies Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop old policies to clear the slate
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_client_select" ON profiles;
DROP POLICY IF EXISTS "profiles_client_update" ON profiles;

DROP POLICY IF EXISTS "clients_select_org" ON clients;
DROP POLICY IF EXISTS "clients_insert_admin" ON clients;
DROP POLICY IF EXISTS "clients_update_admin" ON clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON clients;
DROP POLICY IF EXISTS "clients_admin_all" ON clients;
DROP POLICY IF EXISTS "clients_select_self" ON clients;

DROP POLICY IF EXISTS "projects_select_org" ON projects;
DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
DROP POLICY IF EXISTS "projects_update_admin" ON projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
DROP POLICY IF EXISTS "projects_admin_all" ON projects;
DROP POLICY IF EXISTS "projects_client_select" ON projects;

DROP POLICY IF EXISTS "milestones_select" ON milestones;
DROP POLICY IF EXISTS "milestones_insert" ON milestones;
DROP POLICY IF EXISTS "milestones_update" ON milestones;
DROP POLICY IF EXISTS "milestones_admin_all" ON milestones;
DROP POLICY IF EXISTS "milestones_client_select" ON milestones;

DROP POLICY IF EXISTS "project_tags_select" ON project_tags;
DROP POLICY IF EXISTS "project_tags_insert" ON project_tags;
DROP POLICY IF EXISTS "project_tags_admin_all" ON project_tags;
DROP POLICY IF EXISTS "project_tags_client_select" ON project_tags;

DROP POLICY IF EXISTS "project_closure_select" ON project_closure;
DROP POLICY IF EXISTS "project_closure_insert" ON project_closure;
DROP POLICY IF EXISTS "project_closure_admin_all" ON project_closure;
DROP POLICY IF EXISTS "project_closure_client_select" ON project_closure;

DROP POLICY IF EXISTS "requirements_select" ON requirements;
DROP POLICY IF EXISTS "requirements_insert" ON requirements;
DROP POLICY IF EXISTS "requirements_update" ON requirements;
DROP POLICY IF EXISTS "requirements_admin_all" ON requirements;
DROP POLICY IF EXISTS "requirements_client_all" ON requirements;

DROP POLICY IF EXISTS "documents_select_org" ON documents;
DROP POLICY IF EXISTS "documents_insert_members" ON documents;
DROP POLICY IF EXISTS "documents_delete_admin" ON documents;
DROP POLICY IF EXISTS "documents_admin_all" ON documents;
DROP POLICY IF EXISTS "documents_client_select" ON documents;
DROP POLICY IF EXISTS "documents_client_insert" ON documents;

DROP POLICY IF EXISTS "invoices_select_org" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_admin_all" ON invoices;
DROP POLICY IF EXISTS "invoices_client_select" ON invoices;

DROP POLICY IF EXISTS "payments_select_org" ON payments;
DROP POLICY IF EXISTS "payments_insert_admin" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_client_select" ON payments;

DROP POLICY IF EXISTS "notes_select" ON notes;
DROP POLICY IF EXISTS "notes_insert" ON notes;
DROP POLICY IF EXISTS "notes_update" ON notes;
DROP POLICY IF EXISTS "notes_delete" ON notes;
DROP POLICY IF EXISTS "notes_admin_all" ON notes;
DROP POLICY IF EXISTS "notes_client_select" ON notes;

DROP POLICY IF EXISTS "activities_select_org" ON activities;
DROP POLICY IF EXISTS "activities_insert_members" ON activities;
DROP POLICY IF EXISTS "activities_admin_all" ON activities;

DROP POLICY IF EXISTS "organizations_admin_all" ON organizations;
DROP POLICY IF EXISTS "organizations_client_select" ON organizations;

-- 1. Helper Function: Get Client ID from email inside auth token
CREATE OR REPLACE FUNCTION auth_client_id()
RETURNS uuid AS $$
  SELECT id FROM public.clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Update profiles handling trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  matched_client record;
BEGIN
  -- Try to find a client record matching the new user's email
  SELECT id, name, org_id INTO matched_client FROM public.clients WHERE email = NEW.email LIMIT 1;
  
  IF matched_client.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, org_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', matched_client.name),
      NEW.raw_user_meta_data->>'avatar_url',
      'client',
      matched_client.org_id
    );
  ELSE
    INSERT INTO public.profiles (id, full_name, avatar_url, role, org_id)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      'admin',
      '00000000-0000-0000-0000-000000000001' -- Default Demo Agency
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_closure ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies

-- ORGANIZATIONS
CREATE POLICY "organizations_admin_all" ON organizations FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "organizations_client_select" ON organizations FOR SELECT USING (id = auth_org_id());

-- PROFILES
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "profiles_client_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_client_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- CLIENTS
CREATE POLICY "clients_admin_all" ON clients FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "clients_select_self" ON clients FOR SELECT USING (id = auth_client_id());

-- PROJECTS
CREATE POLICY "projects_admin_all" ON projects FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "projects_client_select" ON projects FOR SELECT USING (client_id = auth_client_id());

-- MILESTONES
CREATE POLICY "milestones_admin_all" ON milestones FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "milestones_client_select" ON milestones FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = auth_client_id())
);

-- PROJECT TAGS
CREATE POLICY "project_tags_admin_all" ON project_tags FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "project_tags_client_select" ON project_tags FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = auth_client_id())
);

-- PROJECT CLOSURE
CREATE POLICY "project_closure_admin_all" ON project_closure FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "project_closure_client_select" ON project_closure FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = auth_client_id())
);

-- REQUIREMENTS
CREATE POLICY "requirements_admin_all" ON requirements FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "requirements_client_all" ON requirements FOR ALL USING (client_id = auth_client_id());

-- DOCUMENTS
CREATE POLICY "documents_admin_all" ON documents FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "documents_client_select" ON documents FOR SELECT USING (client_id = auth_client_id());
CREATE POLICY "documents_client_insert" ON documents FOR INSERT WITH CHECK (client_id = auth_client_id());

-- INVOICES
CREATE POLICY "invoices_admin_all" ON invoices FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "invoices_client_select" ON invoices FOR SELECT USING (client_id = auth_client_id());

-- PAYMENTS
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "payments_client_select" ON payments FOR SELECT USING (client_id = auth_client_id());

-- NOTES
CREATE POLICY "notes_admin_all" ON notes FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
CREATE POLICY "notes_client_select" ON notes FOR SELECT USING (
  type IN ('shared', 'meeting') AND client_id = auth_client_id()
);

-- ACTIVITIES
CREATE POLICY "activities_admin_all" ON activities FOR ALL USING (auth_role() = 'admin' AND org_id = auth_org_id());
