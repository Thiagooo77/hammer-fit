import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Master Admin redirect safety
  const session = supabase.auth.getSession();
  
  if (role === "admin" || role === "manager") {
    return <Navigate to="/admin/dashboard" />;
  }

  return <Navigate to="/reception/dashboard" />;
}
