import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AppRole } from "@/types";

interface Props {
  children: React.ReactNode;
  requireRole?: AppRole;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const denied = !!user && !!requireRole && role !== requireRole && role !== "admin";

  useEffect(() => {
    if (denied) {
      console.log("[HammerPonto] route.denied", { path: location.pathname, role });
      toast.error("Acesso restrito a administradores.");
    }
  }, [denied, location.pathname, role]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (denied) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
