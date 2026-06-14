export type UserRole = "admin" | "team_member" | "client";
export type OrgPlan = "starter" | "pro" | "enterprise";
export type ClientStatus = "active" | "onboarding" | "inactive";
export type ProjectStage =
  | "requirements"
  | "planning"
  | "design"
  | "development"
  | "testing"
  | "deployment"
  | "completed";
export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";
export type RequirementStatus = "draft" | "submitted" | "reviewed";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type NoteType = "internal" | "shared" | "meeting";
export type DeadlineStatus = "on_track" | "delayed" | "completed";
export type PaymentMethod = "bank" | "upi" | "cash" | "card";

export interface Organization {
  id: string;
  name: string;
  plan: OrgPlan;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  language: "en" | "ta";
  org_id: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  gst: string | null;
  notes: string | null;
  status: ClientStatus;
  avatar_url: string | null;
  created_at: string;
  created_by: string;
}

export interface Project {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  description: string | null;
  stage: ProjectStage;
  status: ProjectStatus;
  start_date: string | null;
  delivery_date: string | null;
  completion_pct: number;
  created_at: string;
  created_by: string;
  // joined
  client?: Client;
  tags?: ProjectTag[];
  milestones?: Milestone[];
}

export interface ProjectTag {
  id: string;
  project_id: string;
  label: string;
  color: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
}

export interface RequirementStepData {
  project_type?: string;
  business_name?: string;
  business_description?: string;
  industry?: string;
  goals?: string[];
  references?: string[];
  additional_notes?: string;
  files?: string[];
  
  // Support camelCase used in wizard/UI
  projectType?: string;
  businessName?: string;
  businessDescription?: string;
  additionalNotes?: string;
  uploadedFilePaths?: string[];
}

export interface Requirement {
  id: string;
  project_id: string | null;
  client_id: string;
  step_data: RequirementStepData;
  status: RequirementStatus;
  submitted_at: string | null;
  created_at: string;
  client?: Client;
}

export interface Document {
  id: string;
  org_id: string;
  project_id: string | null;
  client_id: string;
  name: string;
  file_path: string;
  file_type: "pdf" | "jpg" | "png" | "docx";
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  org_id: string;
  client_id: string;
  project_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  notes: string | null;
  created_at: string;
  // joined
  client?: Client;
  project?: Project;
}

export interface Payment {
  id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  paid_at: string;
  method: PaymentMethod;
  reference: string | null;
  // joined
  invoice?: Invoice;
  client?: Client;
}

export interface Note {
  id: string;
  org_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  content: string;
  type: NoteType;
  created_by: string;
  created_at: string;
  // joined
  author?: Profile;
}

export interface Activity {
  id: string;
  org_id: string;
  actor_id: string;
  entity_type: "client" | "project" | "invoice" | "document" | "milestone" | "deadline";
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
  // joined
  actor?: Profile;
}

export interface ProjectClosure {
  id: string;
  project_id: string;
  rating: number;
  feedback: string | null;
  testimonial: string | null;
  summary: string | null;
  closed_at: string;
}

// Supabase Database type (simplified for now)
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      project_tags: { Row: ProjectTag; Insert: Partial<ProjectTag>; Update: Partial<ProjectTag> };
      milestones: { Row: Milestone; Insert: Partial<Milestone>; Update: Partial<Milestone> };
      requirements: { Row: Requirement; Insert: Partial<Requirement>; Update: Partial<Requirement> };
      documents: { Row: Document; Insert: Partial<Document>; Update: Partial<Document> };
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      notes: { Row: Note; Insert: Partial<Note>; Update: Partial<Note> };
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> };
      project_closure: { Row: ProjectClosure; Insert: Partial<ProjectClosure>; Update: Partial<ProjectClosure> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
