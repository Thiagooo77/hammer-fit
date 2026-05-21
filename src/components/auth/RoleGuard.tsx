import React from "react";
import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/services/authService";

interface RoleGuardProps {
  allowedRoles: AppRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (!role || !allowedRoles.includes(role)) {
    console.log('[PERMISSION_DENIED] Insufficient role level', { role, required: allowedRoles });
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
}
