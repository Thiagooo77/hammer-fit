import { useAuth } from "./useAuth";
import { AppRole } from "@/services/authService";

export function usePermissions() {
  const { role, isAdmin, isManager, isReceptionist } = useAuth();

  const canManageUsers = isAdmin;
  const canEditGoals = isAdmin;
  const canEditSales = isAdmin;
  const canViewAllDashboards = isAdmin || isManager;
  const canViewAuditory = isAdmin || isManager;
  const canViewFullAuditory = isAdmin;
  const canOpenCashier = isReceptionist || isManager || isAdmin;
  const canRegisterSale = isReceptionist || isManager || isAdmin;

  return {
    role,
    isAdmin,
    isManager,
    isReceptionist,
    canManageUsers,
    canEditGoals,
    canEditSales,
    canViewAllDashboards,
    canViewAuditory,
    canViewFullAuditory,
    canOpenCashier,
    canRegisterSale,
  };
}
