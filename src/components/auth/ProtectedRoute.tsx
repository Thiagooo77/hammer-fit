import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading, session } = useAuth();
  const { canViewAllDashboards } = usePermissions();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const timeout = (expiresAt * 1000) - Date.now();
        if (timeout > 0) {
          const timer = setTimeout(() => {
            toast.error("Sessão expirada. Por favor, faça login novamente.");
            window.location.reload();
          }, timeout);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background/50 backdrop-blur-md">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[AUTH]', { action: 'redirect_to_login', from: location.pathname });
    return <Navigate to="/login" search={{ redirect: location.pathname }} />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    console.warn('[AUTH]', { action: 'unauthorized_access', role, required: allowedRoles });
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <Outlet />
    </div>
  );
}
