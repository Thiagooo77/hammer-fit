import { ROLE_PERMISSIONS, Permission } from "@/config/permissions";

export const hasPermission = (role: string | null | undefined, permission: Permission): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  const has = permissions.includes(permission);
  
  if (!has) {
    console.log('[PERMISSION_DENIED]', { role, permission });
  } else {
    console.log('[PERMISSION_GRANTED]', { role, permission });
  }
  
  return has;
};

export const canAccessModule = (role: string | null | undefined, module: string): boolean => {
  if (!role) return false;
  
  // Simple logic for module access
  if (role === 'admin') return true;
  if (role === 'manager') {
    return ['dashboard', 'sales', 'goals', 'receptionists', 'reports', 'tasks'].includes(module);
  }
  if (role === 'receptionist') {
    return ['reception', 'tasks'].includes(module);
  }
  
  return false;
};
