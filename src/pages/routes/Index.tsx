import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin" || role === "manager") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/reception/dashboard" replace />;
}
