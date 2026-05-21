import { useAuthContext } from "@/context/AuthProvider";
import { Permission } from "@/config/permissions";
import { hasPermission, canAccessModule } from "@/utils/permissionChecker";
import { useMemo } from "react";

export function usePermissions() {
  const { role, isAdmin, isManager, isReceptionist } = useAuthContext();

  const permissions = useMemo(() => ({
    role,
    isAdmin,
    isManager,
    isReceptionist,
    
    // Actions
    canManageUsers: hasPermission(role, 'manage_users'),
    canEditGoals: hasPermission(role, 'manage_goals'),
    canEditSales: hasPermission(role, 'manage_sales'),
    canExportReports: hasPermission(role, 'export_reports'),
    canApproveClosing: hasPermission(role, 'approve_closing'),
    
    // Views
    canViewAllDashboards: isAdmin || isManager,
    canViewAuditory: hasPermission(role, 'view_audit'),
    canViewFullAuditory: hasPermission(role, 'view_full_audit'),
    canViewSales: hasPermission(role, 'view_sales'),
    canViewGoals: hasPermission(role, 'view_goals'),
    
    // Reception
    canOpenCashier: hasPermission(role, 'open_cash'),
    canRegisterSale: hasPermission(role, 'create_sale'),
    
    // Helpers
    checkPermission: (permission: Permission) => hasPermission(role, permission),
    checkModule: (module: string) => canAccessModule(role, module),
  }), [role, isAdmin, isManager, isReceptionist]);

  return permissions;
}
