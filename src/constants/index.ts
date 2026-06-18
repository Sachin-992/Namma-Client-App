export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  CLIENTS: "/clients",
  CLIENT_DETAIL: "/clients/:id",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  REQUIREMENTS: "/requirements",
  REQUIREMENT_WIZARD: "/requirements/wizard",
  DOCUMENTS: "/documents",
  INVOICES: "/invoices",
  INVOICE_DETAIL: "/invoices/:id",
  PAYMENTS: "/payments",
  DEADLINES: "/deadlines",
  NOTES: "/notes",
  WELCOME: "/welcome",
  SETTINGS: "/settings",
  CLOSURE: "/projects/:id/closure",
  CLIENT_DASHBOARD: "/client/dashboard",
  CLIENT_PROJECTS: "/client/projects",
  CLIENT_REQUIREMENTS: "/client/requirements",
  CLIENT_DOCUMENTS: "/client/documents",
  CLIENT_INVOICES: "/client/invoices",
  CLIENT_PAYMENTS: "/client/payments",
  CLIENT_DEADLINES: "/client/deadlines",
  CLIENT_PROFILE: "/client/profile",
} as const;

export const QUERY_KEYS = {
  PROFILE: ["profile"],
  CLIENTS: ["clients"],
  CLIENT: (id: string) => ["clients", id],
  PROJECTS: ["projects"],
  PROJECT: (id: string) => ["projects", id],
  REQUIREMENTS: ["requirements"],
  DOCUMENTS: ["documents"],
  INVOICES: ["invoices"],
  PAYMENTS: ["payments"],
  DEADLINES: ["deadlines"],
  NOTES: ["notes"],
  ACTIVITIES: ["activities"],
  DASHBOARD_STATS: ["dashboard-stats"],
} as const;

export const PROJECT_STAGES = [
  { key: "requirements", label: "Requirements", color: "bg-purple-100 text-purple-700" },
  { key: "planning", label: "Planning", color: "bg-blue-100 text-blue-700" },
  { key: "design", label: "Design", color: "bg-pink-100 text-pink-700" },
  { key: "development", label: "Development", color: "bg-indigo-100 text-indigo-700" },
  { key: "testing", label: "Testing", color: "bg-yellow-100 text-yellow-700" },
  { key: "deployment", label: "Deployment", color: "bg-orange-100 text-orange-700" },
  { key: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
] as const;

export const PROJECT_TAG_COLORS: Record<string, string> = {
  UI: "#818CF8",
  DEV: "#34D399",
  SEO: "#FBBF24",
  PR: "#FB7185",
  PM: "#60A5FA",
  QA: "#A78BFA",
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];
