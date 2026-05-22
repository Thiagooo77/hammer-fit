import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

import LoginPage from "@/pages/routes/Login";
import IndexPage from "@/pages/routes/Index";
import TVDashboard from "@/pages/routes/TVDashboard";
import { UnauthorizedPage } from "@/pages/Unauthorized";

import AdminDashboard from "@/pages/routes/AdminDashboard";
import AdminSales from "@/pages/routes/AdminSales";
import AdminReceptionists from "@/pages/routes/AdminReceptionists";

import AdminGoals from "@/pages/routes/AdminGoals";
import AdminReports from "@/pages/routes/AdminReports";
import AdminCashApprovals from "@/pages/routes/AdminCashApprovals";
import AdminSettings from "@/pages/routes/AdminSettings";

import ReceptionDashboard from "@/pages/routes/ReceptionDashboard";
import ReceptionTasks from "@/pages/routes/ReceptionTasks";

function AuthenticatedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-slate-950" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 w-full">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function AdminGate() {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950" />;
  if (role !== "admin" && role !== "manager") return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/tv-dashboard" element={<TVDashboard />} />

      <Route element={<AuthenticatedLayout />}>
        <Route element={<AdminGate />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/receptionists" element={<AdminReceptionists />} />
          
          <Route path="/admin/goals" element={<AdminGoals />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/cash-approvals" element={<AdminCashApprovals />} />
        </Route>

        <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
        <Route path="/reception/tasks" element={<ReceptionTasks />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
