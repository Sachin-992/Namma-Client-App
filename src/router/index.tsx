import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import logoSquare from "@/assets/logo-square.jpg";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ClientsPage = lazy(() => import("@/pages/clients/ClientsPage"));
const ClientDetailPage = lazy(() => import("@/pages/clients/ClientDetailPage"));
const ProjectsPage = lazy(() => import("@/pages/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/projects/ProjectDetailPage"));
const RequirementsPage = lazy(() => import("@/pages/requirements/RequirementsPage"));
const RequirementWizardPage = lazy(() => import("@/pages/requirements/RequirementWizardPage"));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage"));
const InvoicesPage = lazy(() => import("@/pages/invoices/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/invoices/InvoiceDetailPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const DeadlinesPage = lazy(() => import("@/pages/DeadlinesPage"));
const NotesPage = lazy(() => import("@/pages/NotesPage"));
const WelcomeCenterPage = lazy(() => import("@/pages/WelcomeCenterPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProjectClosurePage = lazy(() => import("@/pages/projects/ProjectClosurePage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <img src={logoSquare} alt="Namma Client" className="w-12 h-12 rounded-2xl object-cover" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Client portal */}
          <Route
            path="/welcome"
            element={
              <ProtectedRoute allowedRoles={["client", "admin", "team_member"]}>
                <WelcomeCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requirements/wizard"
            element={
              <ProtectedRoute allowedRoles={["client", "admin", "team_member"]}>
                <div className="min-h-screen bg-[#F0F2F8] py-8 px-4 md:px-6">
                  <RequirementWizardPage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Admin / Team member routes inside AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin", "team_member"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:id/closure" element={<ProjectClosurePage />} />
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="deadlines" element={<DeadlinesPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
