/**
 * Dynamic Hackathon Role Registry & RBAC Permissions
 * Customized for: SSBackend
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  STAFF: 'STAFF',
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.INVENTORY_MANAGER]: [
    'products:read',
    'products:write',
    'warehouses:read',
    'locations:read',
    'operations:read',
    'operations:write',
    'operations:validate',
    'receipts:manage',
    'deliveries:manage',
    'transfers:manage',
    'adjustments:manage',
    'ledger:read',
    'dashboard:read',
    'reports:export',
  ],
  [ROLES.STAFF]: [
    'products:read',
    'warehouses:read',
    'locations:read',
    'operations:read',
    'transfers:create',
    'transfers:execute',
    'adjustments:create',
    'receipts:read',
    'deliveries:read',
    'deliveries:pick_pack',
    'ledger:read',
  ],
};

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
};
