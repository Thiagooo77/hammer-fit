export type Permission = 
  | 'manage_users' 
  | 'manage_sales' 
  | 'manage_goals' 
  | 'view_audit' 
  | 'view_full_audit'
  | 'export_reports'
  | 'view_sales'
  | 'view_goals'
  | 'approve_closing'
  | 'open_cash'
  | 'close_cash'
  | 'create_sale'
  | 'view_own_meta'
  | 'view_own_ranking';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'manage_users',
    'manage_sales',
    'manage_goals',
    'view_audit',
    'view_full_audit',
    'export_reports',
    'view_sales',
    'view_goals',
    'approve_closing',
    'open_cash',
    'close_cash',
    'create_sale',
  ],
  manager: [
    'view_sales',
    'view_goals',
    'approve_closing',
    'view_audit', // Parcial
    'export_reports',
    'open_cash',
    'close_cash',
    'create_sale',
  ],
  receptionist: [
    'open_cash',
    'close_cash',
    'create_sale',
    'view_own_meta',
    'view_own_ranking',
  ],
};
