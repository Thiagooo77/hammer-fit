import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, role, loading } = useAuth();

  // If loading auth state, show a clean background
  if (loading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // If not authenticated, go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Admin/Manager go to admin dashboard
  if (role === "admin" || role === "manager") {
    return <Navigate to="/admin/dashboard" />;
  }

  // Everyone else (receptionists) go to reception dashboard
  return <Navigate to="/reception/dashboard" />;
}
