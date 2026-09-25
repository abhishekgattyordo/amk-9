import { User, ModuleType } from '../types';

/**
 * Map of module types to primary and fallback/alias permission names.
 */
export const MODULE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['dashboard:view', 'dashboard:read', 'inventory:read', 'inventory_dashboard:view', 'all:read'],
  inventory_raw: ['inventory_raw:view', 'inventory_raw:read', 'inventory:read', 'all:read'],
  inventory_products: ['inventory_products:view', 'inventory_products:read', 'inventory:read', 'all:read'],
  inventory_categories: ['inventory_categories:view', 'inventory_categories:read', 'inventory:read', 'all:read'],
  inventory_suppliers: ['inventory_suppliers:view', 'inventory_suppliers:read', 'inventory:read', 'procurement:read', 'all:read'],
  inventory_warehouses: ['inventory_warehouses:view', 'inventory_warehouses:read', 'inventory:read', 'all:read'],
  inventory_transactions: ['inventory_transactions:view', 'inventory_transactions:read', 'inventory:read', 'all:read'],
  inventory_stock: ['inventory_stock:view', 'inventory_stock:read', 'inventory:read', 'all:read'],

  procurement: ['procurement_dashboard:view', 'procurement:read', 'procurement:view', 'all:read'],
  procurement_dashboard: ['procurement_dashboard:view', 'procurement:read', 'procurement:view', 'all:read'],
  procurement_rfq: ['procurement_rfq:view', 'procurement_rfq:read', 'procurement:read', 'all:read'],
  procurement_quotes: ['procurement_quotes:view', 'procurement_quotes:read', 'procurement:read', 'all:read'],
  procurement_po: ['procurement_po:view', 'procurement_po:read', 'procurement:read', 'all:read'],
  procurement_gate_entry: ['procurement_gate_entry:view', 'procurement_gate_entry:read', 'procurement_inward:view', 'procurement:read', 'all:read'],
  procurement_reel_inward: ['procurement_reel_inward:view', 'procurement_reel_inward:read', 'procurement_inward:view', 'procurement:read', 'all:read'],
  procurement_inward: ['procurement_inward:view', 'procurement_inward:read', 'procurement_gate_entry:view', 'procurement:read', 'all:read'],
  procurement_qc: ['procurement_qc:view', 'procurement_qc:read', 'procurement:read', 'all:read'],

  production: ['production:view', 'production:read', 'all:read'],
  production_dashboard: ['production_dashboard:view', 'production_dashboard:read', 'production:view', 'production:read', 'all:read'],
  production_planning: ['production_planning:view', 'production_planning:read', 'production:view', 'production:read', 'all:read'],
  production_work_orders: ['production_work_orders:view', 'production_work_orders:read', 'production:view', 'production:read', 'all:read'],
  production_orders: ['production_orders:view', 'production_orders:read', 'production:view', 'production:read', 'all:read'],
  production_indents: ['production_indents:view', 'production_indents:read', 'production:view', 'production:read', 'all:read'],
  production_floor: ['production_floor:view', 'production_floor:read', 'production:view', 'production:read', 'all:read'],
  production_floor_ops: ['production_floor:view', 'production_floor:read', 'production:view', 'production:read', 'all:read'],
  production_reports: ['production_reports:view', 'production_reports:read', 'production:view', 'production:read', 'all:read'],
  production_approvals: ['production_approvals:view', 'production_approvals:read', 'production:view', 'production:read', 'all:read'],
  production_fg: ['production_fg:view', 'production_fg:read', 'production_qc:view', 'production:view', 'production:read', 'all:read'],
  production_machines: ['production_machines:view', 'production_machines:read', 'production:view', 'production:read', 'all:read'],
  production_scrap: ['production_scrap:view', 'production_scrap_downtime:view', 'production_scrap_downtime:read', 'production:view', 'production:read', 'all:read'],
  production_scrap_downtime: ['production_scrap_downtime:view', 'production_scrap_downtime:read', 'production:view', 'production:read', 'all:read'],
  production_qc: ['production_qc:view', 'production_qc:read', 'production:view', 'production:read', 'all:read'],
  production_bom: ['production_bom:view', 'production_bom:read', 'costing_bom:view', 'production:view', 'production:read', 'all:read'],
  production_corrugation: ['production_corrugation:view', 'production_corrugation:read', 'production:view', 'production:read', 'all:read'],
  production_printing: ['production_printing:view', 'production_printing:read', 'production:view', 'production:read', 'all:read'],
  production_finishing: ['production_finishing:view', 'production_finishing:read', 'production:view', 'production:read', 'all:read'],
  production_shifts: ['production_shifts:view', 'production_shifts:read', 'production:view', 'production:read', 'all:read'],
  production_maintenance: ['production_maintenance:view', 'production_maintenance:read', 'production:view', 'production:read', 'all:read'],

  costing: ['costing:view', 'costing:read', 'costing_dashboard:view', 'sales:read', 'sales:view', 'all:read'],
  costing_dashboard: ['costing_dashboard:view', 'costing:view', 'costing:read', 'sales:read', 'all:read'],
  costing_bom: ['costing_bom:view', 'costing_bom:read', 'costing:view', 'costing:read', 'production_bom:view', 'sales:read', 'all:read'],
  costing_sheets: ['costing_sheets:view', 'costing:view', 'costing:read', 'sales:read', 'all:read'],
  costing_new: ['costing_new:view', 'costing:create', 'costing:view', 'costing:read', 'sales:read', 'all:read'],
  costing_pending: ['costing_pending:view', 'costing_approval:view', 'costing:view', 'costing:read', 'sales:read', 'all:read'],
  costing_approved: ['costing_approved:view', 'costing:view', 'costing:read', 'sales:read', 'all:read'],
  costing_history: ['costing_history:view', 'costing:view', 'costing:read', 'sales:read', 'all:read'],

  sales: ['sales_dashboard:view', 'sales:read', 'sales:view', 'all:read'],
  sales_dashboard: ['sales_dashboard:view', 'sales:read', 'sales:view', 'all:read'],
  sales_leads: ['sales_leads:view', 'sales_leads:read', 'sales:read', 'all:read'],
  sales_quotations: ['sales_quotations:view', 'sales_quotations:read', 'sales:read', 'all:read'],
  sales_orders: ['sales_orders:view', 'sales_orders:read', 'sales:read', 'all:read'],
  sales_customers: ['sales_customers:view', 'sales_customers:read', 'sales:read', 'all:read'],
  sales_dispatch: ['sales_dispatch:view', 'sales_dispatch:read', 'dispatch:view', 'sales:read', 'all:read'],
  dispatch: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'dispatch_dashboard:view', 'sales:read', 'all:read'],
  dispatch_dashboard: ['dispatch_dashboard:view', 'dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],
  dispatch_list: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],
  dispatch_pending: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],
  dispatch_completed: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],
  dispatch_history: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],
  dispatch_create: ['dispatch:create', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:create', 'dispatch:view', 'all:read'],
  dispatch_view: ['dispatch:view', 'dispatch:read', 'sales_dispatch:view', 'sales_dispatch:read', 'sales:read', 'all:read'],

  qc: ['qc:view', 'qc:read', 'procurement_qc:view', 'production_qc:view', 'all:read'],
  quality_control: ['qc:view', 'qc:read', 'procurement_qc:view', 'production_qc:view', 'all:read'],
  qc_dashboard: ['qc_dashboard:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_raw_material: ['qc_raw_material:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_corrugation: ['qc_corrugation:view', 'qc:view', 'qc:read', 'production_qc:view', 'all:read'],
  qc_finished_goods: ['qc_finished_goods:view', 'qc:view', 'qc:read', 'all:read'],
  qc_calibration: ['qc_calibration:view', 'qc:view', 'qc:read', 'all:read'],
  qc_nc: ['qc_nc:view', 'qc:view', 'qc:read', 'all:read'],
  qc_inspections: ['qc_inspections:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_pending: ['qc_pending:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_approved: ['qc_approved:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_rejected: ['qc_rejected:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],
  qc_history: ['qc_history:view', 'qc:view', 'qc:read', 'procurement_qc:view', 'all:read'],

  accounts: ['accounts:view', 'accounts:read', 'all:read'],
  accounts_dashboard: ['accounts:view', 'accounts:read', 'all:read'],
  accounts_invoices: ['accounts:view', 'accounts:read', 'accounts_invoices:view', 'all:read'],
  accounts_payments: ['accounts:view', 'accounts:read', 'accounts_payments:view', 'all:read'],
  accounts_ledger: ['accounts:view', 'accounts:read', 'accounts_ledger:view', 'all:read'],

  reports: ['reports:view', 'reports:read', 'all:read'],
  reports_dashboard: ['reports:view', 'reports:read', 'all:read'],
  reports_sales: ['reports:view', 'reports:read', 'reports_sales:view', 'all:read'],
  reports_purchase: ['reports:view', 'reports:read', 'reports_purchase:view', 'all:read'],
  reports_inventory: ['reports:view', 'reports:read', 'reports_inventory:view', 'all:read'],
  reports_production: ['reports:view', 'reports:read', 'reports_production:view', 'all:read'],
  reports_dispatch: ['reports:view', 'reports:read', 'reports_dispatch:view', 'all:read'],
  reports_financial: ['reports:view', 'reports:read', 'reports_financial:view', 'all:read'],

  settings: ['settings:view', 'settings:read', 'all:read'],
  admin_excel: ['admin_excel:view', 'admin_excel:read', 'excel:read', 'all:read'],
  user_management: ['user_management:view', 'user_management:read', 'users:read', 'users:write', 'all:read'],
  roles_permissions: ['user_management:manage_roles', 'user_management:view', 'roles:read', 'roles:write', 'all:read'],
  audit_logs: ['user_management:view', 'audit_logs:view', 'all:read'],
  recycle_bin: ['recycle_bin:view', 'recycle_bin:read', 'all:read'],
};

/**
 * Checks if the current user is an Administrator / Super Admin with global access.
 */
export function isAdminUser(user: Partial<User> | null | undefined): boolean {
  if (!user) return false;
  const roleName = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
  return roleName === 'Administrator' || roleName === 'Super Admin';
}

/**
 * Checks if a user has a specific permission name or any of its fallbacks.
 */
export function hasPermission(
  user: Partial<User> | null | undefined,
  permissionName: string
): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const permissions: string[] = user.permissions || [];
  if (permissions.includes('all:read') || permissions.includes('all:write')) {
    return true;
  }

  if (permissions.includes(permissionName)) {
    return true;
  }

  // Check aliases for standard formats e.g. 'inventory_raw:view' -> 'inventory_raw:read'
  const [prefix, action] = permissionName.split(':');
  if (prefix && action) {
    if (permissions.includes(`${prefix}:read`) || permissions.includes(`${prefix}:view`)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a user has permission to access a given module/page.
 */
export function canAccessModule(
  user: Partial<User> | null | undefined,
  moduleType: ModuleType | string
): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const requiredPerms = MODULE_PERMISSIONS[moduleType];
  if (!requiredPerms || requiredPerms.length === 0) {
    // If module not explicitly mapped, check generic format key:view
    return hasPermission(user, `${moduleType}:view`);
  }

  const userPermissions: string[] = user.permissions || [];
  if (userPermissions.includes('all:read') || userPermissions.includes('all:write')) {
    return true;
  }

  return requiredPerms.some(perm => userPermissions.includes(perm));
}

/**
 * Checks if a user can access at least one module in a given list of module types.
 */
export function canAccessAnyModule(
  user: Partial<User> | null | undefined,
  moduleTypes: (ModuleType | string)[]
): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  return moduleTypes.some(mod => canAccessModule(user, mod));
}
