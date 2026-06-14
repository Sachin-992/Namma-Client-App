-- ============================================================
-- Namma Client — Supabase Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text NOT NULL,
  plan        text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'team_member', 'client')),
  language    text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  org_id      uuid REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  company     text,
  email       text NOT NULL,
  phone       text,
  address     text,
  gst         text,
  notes       text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'onboarding', 'inactive')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES profiles(id)
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  stage           text NOT NULL DEFAULT 'requirements'
                    CHECK (stage IN ('requirements','planning','design','development','testing','deployment','completed')),
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','on_hold','completed','cancelled')),
  start_date      date,
  delivery_date   date,
  completion_pct  integer NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES profiles(id)
);

-- ============================================================
-- PROJECT TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_tags (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
  label       text NOT NULL,
  color       text NOT NULL DEFAULT '#818CF8'
);

-- ============================================================
-- MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  title         text NOT NULL,
  due_date      date,
  completed     boolean NOT NULL DEFAULT false,
  completed_at  timestamptz
);

-- ============================================================
-- REQUIREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS requirements (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE CASCADE,
  step_data     jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed')),
  submitted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE CASCADE,
  name          text NOT NULL,
  file_path     text NOT NULL,
  file_type     text NOT NULL CHECK (file_type IN ('pdf','jpg','png','docx')),
  file_size     integer NOT NULL DEFAULT 0,
  uploaded_by   uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number  text NOT NULL UNIQUE,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  amount          numeric(12,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'INR',
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  due_date        date,
  paid_at         timestamptz,
  line_items      jsonb NOT NULL DEFAULT '[]',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id  uuid REFERENCES invoices(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  amount      numeric(12,2) NOT NULL,
  paid_at     timestamptz NOT NULL DEFAULT now(),
  method      text NOT NULL DEFAULT 'bank' CHECK (method IN ('bank','upi','cash','card')),
  reference   text
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  title       text NOT NULL,
  content     text NOT NULL DEFAULT '',
  type        text NOT NULL DEFAULT 'internal' CHECK (type IN ('internal','shared','meeting')),
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id     uuid REFERENCES profiles(id),
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  action       text NOT NULL,
  description  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECT CLOSURE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_closure (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback    text,
  testimonial text,
  summary     text,
  closed_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
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

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's org_id
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Clients: org members can CRUD; clients read their own linked record
CREATE POLICY "clients_select_org" ON clients FOR SELECT
  USING (org_id = auth_org_id() OR auth_role() = 'admin');
CREATE POLICY "clients_insert_admin" ON clients FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "clients_update_admin" ON clients FOR UPDATE
  USING (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "clients_delete_admin" ON clients FOR DELETE
  USING (auth_role() = 'admin');

-- Projects: org members can CRUD
CREATE POLICY "projects_select_org" ON projects FOR SELECT
  USING (org_id = auth_org_id() OR auth_role() = 'admin');
CREATE POLICY "projects_insert_admin" ON projects FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "projects_update_admin" ON projects FOR UPDATE
  USING (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "projects_delete_admin" ON projects FOR DELETE
  USING (auth_role() = 'admin');

-- Documents: org members manage; read based on org
CREATE POLICY "documents_select_org" ON documents FOR SELECT
  USING (org_id = auth_org_id());
CREATE POLICY "documents_insert_members" ON documents FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "documents_delete_admin" ON documents FOR DELETE
  USING (auth_role() = 'admin');

-- Invoices: admin/team manage
CREATE POLICY "invoices_select_org" ON invoices FOR SELECT
  USING (org_id = auth_org_id());
CREATE POLICY "invoices_insert_admin" ON invoices FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "invoices_update_admin" ON invoices FOR UPDATE
  USING (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "invoices_delete_admin" ON invoices FOR DELETE
  USING (auth_role() = 'admin');

-- Payments: admin/team manage
CREATE POLICY "payments_select_org" ON payments FOR SELECT
  USING (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "payments_insert_admin" ON payments FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));

-- Notes: internal = admin only; shared/meeting = all org members
CREATE POLICY "notes_select" ON notes FOR SELECT
  USING (
    (type = 'internal' AND auth_role() IN ('admin', 'team_member'))
    OR (type IN ('shared', 'meeting') AND org_id = auth_org_id())
  );
CREATE POLICY "notes_insert" ON notes FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "notes_update" ON notes FOR UPDATE
  USING (created_by = auth.uid() OR auth_role() = 'admin');
CREATE POLICY "notes_delete" ON notes FOR DELETE
  USING (auth_role() = 'admin');

-- Activities: all org members can read
CREATE POLICY "activities_select_org" ON activities FOR SELECT
  USING (org_id = auth_org_id());
CREATE POLICY "activities_insert_members" ON activities FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'team_member'));

-- Requirements: all org members manage; clients can insert their own
CREATE POLICY "requirements_select" ON requirements FOR SELECT
  USING (auth_role() IN ('admin', 'team_member') OR client_id IN (SELECT id FROM clients WHERE created_by = auth.uid()));
CREATE POLICY "requirements_insert" ON requirements FOR INSERT
  WITH CHECK (true);
CREATE POLICY "requirements_update" ON requirements FOR UPDATE
  USING (auth_role() IN ('admin', 'team_member'));

-- Milestones / Project Tags / Closure: follow project access
CREATE POLICY "milestones_select" ON milestones FOR SELECT USING (true);
CREATE POLICY "milestones_insert" ON milestones FOR INSERT WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "milestones_update" ON milestones FOR UPDATE USING (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "project_tags_select" ON project_tags FOR SELECT USING (true);
CREATE POLICY "project_tags_insert" ON project_tags FOR INSERT WITH CHECK (auth_role() IN ('admin', 'team_member'));
CREATE POLICY "project_closure_select" ON project_closure FOR SELECT USING (true);
CREATE POLICY "project_closure_insert" ON project_closure FOR INSERT WITH CHECK (auth_role() IN ('admin', 'team_member'));

-- ============================================================
-- STORAGE BUCKETS (run separately or via Supabase dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-attachments', 'invoice-attachments', false);

-- ============================================================
-- SEED DATA (Demo)
-- ============================================================
-- Insert demo organization
INSERT INTO organizations (id, name, plan) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Namma Demo Agency', 'pro')
ON CONFLICT DO NOTHING;
