/**
 * StockSense Role-Based Access Control (RBAC) Utility
 * Implements permissions defined in StockSense-Build-Plan.md
 *
 * Roles:
 * 1. ADMIN - System owner: Full system control, users, warehouses, settings
 * 2. INVENTORY_MANAGER - Operations owner: Products, Receipts, Deliveries, Adjustments approval, Reports
 * 3. STAFF (Warehouse Staff) - Task execution: Transfers, Pick/Pack, Physical count entry, Read-only Dashboard
 */

export const normalizeRole = (role) => {
  if (!role) return 'STAFF';
  const r = String(role).toUpperCase().trim();
  if (r.includes('ADMIN')) return 'ADMIN';
  if (r.includes('MANAGER') || r.includes('INV')) return 'INVENTORY_MANAGER';
  if (r.includes('STAFF') || r.includes('WAREHOUSE')) return 'STAFF';
  return 'STAFF';
};

export const ROLES = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  STAFF: 'STAFF'
};

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  INVENTORY_MANAGER: 'Inventory Manager',
  STAFF: 'Warehouse Staff'
};

export const hasPermission = {
  // Settings & System Administration
  canManageSettings: (role) => normalizeRole(role) === 'ADMIN',
  canManageUsers: (role) => normalizeRole(role) === 'ADMIN',
  canManageWarehouses: (role) => normalizeRole(role) === 'ADMIN',

  // Product Catalog
  canManageProducts: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },

  // Inbound Receipts / Purchase Orders
  canCreateReceipts: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },
  canValidateReceipts: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },

  // Outbound Deliveries / Sales Orders
  canCreateDeliveries: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },
  canValidateDeliveries: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },
  canPickPack: (role) => true, // All 3 roles can pick/pack

  // Stock Transfers
  canCreateTransfers: (role) => true, // All 3 roles can execute transfers
  canValidateTransfers: (role) => true,

  // Stock Adjustments
  canEnterAdjustments: (role) => true, // Staff can enter counts
  canValidateAdjustments: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },

  // Reports & Analytics
  canViewReports: (role) => {
    const r = normalizeRole(role);
    return r === 'ADMIN' || r === 'INVENTORY_MANAGER';
  },

  // Dashboard
  canViewDashboard: (role) => true,
  isDashboardReadOnly: (role) => normalizeRole(role) === 'STAFF'
};
