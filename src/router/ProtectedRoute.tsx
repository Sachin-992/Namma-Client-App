import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import logoSquare from "@/assets/logo-square.jpg";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={logoSquare} alt="Namma Client" className="w-12 h-12 rounded-2xl object-cover animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Client role → redirect to welcome center
    if (profile.role === "client") {
      return <Navigate to={ROUTES.WELCOME} replace />;
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={logoSquare} alt="Namma Client" className="w-12 h-12 rounded-2xl object-cover animate-pulse" />
        </div>
      </div>
    );
  }

  if (user) {
    if (profile?.role === "client") return <Navigate to="/welcome" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
