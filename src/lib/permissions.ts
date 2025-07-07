// src/lib/permissions.ts
import type { User, Product } from '@/types';
import { hasRole } from './auth-utils';
import { UserRoles, type Role } from './constants';

/**
 * Custom error class for permission-related failures.
 */
export class PermissionError extends Error {
  constructor(
    message: string = 'You do not have permission to perform this action.',
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

// Centralized list of all possible actions in the system.
export const allActions = [
  // Product Lifecycle
  'product:create',
  'product:edit',
  'product:delete',
  'product:archive',
  'product:submit', // Submit for verification
  'product:add_service_record',

  // Compliance & Auditing
  'product:approve',
  'product:reject',
  'product:resolve', // Compliance Manager resolves a flagged product
  'product:override_verification',
  'compliance:manage', // Create/edit/delete compliance paths

  // AI & Data Actions
  'product:recalculate', // Recalculate AI scores/data
  'product:validate_data',
  'product:run_compliance',
  'product:run_prediction',
  'product:generate_zkp',

  // Specialized Actions
  'product:recycle', // Recycler action
  'product:customs_inspect', // Auditor/Admin action
  
  // Data Export
  'product:export_data',

  // User Management
  'user:manage', // Create/edit/delete other users
  'user:edit', // Edit own profile

  // Company & Settings Management
  'company:manage',
  'admin:manage_settings',

  // Developer / API
  'developer:manage_api',
  'integration:sync',

  // Ticketing
  'ticket:create',
  'ticket:manage',
  'ticket:view_all',
  'support:manage',

  // Manufacturing
  'manufacturer:manage_lines',
] as const;

export type Action = (typeof allActions)[number];

// The definitive permission matrix for the entire platform.
export const permissionMatrix: Record<Role, Action[]> = {
  [UserRoles.ADMIN]: [...allActions], // Admin can do everything.

  [UserRoles.SUPPLIER]: [
    'product:create',
    'product:edit',
    'product:delete', // With resource-specific logic
    'product:archive',
    'product:submit', // Submit for verification
    'product:recalculate',
    'product:validate_data',
    'product:run_prediction',
    'product:export_data',
    'user:edit',
  ],

  [UserRoles.AUDITOR]: [
    'product:approve',
    'product:reject',
    'product:customs_inspect',
    'product:run_compliance',
    'compliance:manage',
    'user:edit',
  ],

  [UserRoles.COMPLIANCE_MANAGER]: [
    'product:resolve',
    'product:archive',
    'product:run_compliance',
    'compliance:manage',
    'user:edit',
  ],

  [UserRoles.MANUFACTURER]: [
    'product:add_service_record',
    'manufacturer:manage_lines',
    'ticket:create',
    'ticket:manage',
    'user:edit',
  ],

  [UserRoles.SERVICE_PROVIDER]: [
    'product:add_service_record',
    'ticket:create',
    'ticket:manage',
    'user:edit',
  ],

  [UserRoles.RECYCLER]: ['product:recycle', 'user:edit'],

  [UserRoles.RETAILER]: ['product:export_data', 'user:edit'],

  [UserRoles.DEVELOPER]: [
    'developer:manage_api',
    'integration:sync',
    'product:generate_zkp',
    'user:edit',
  ],
  
  [UserRoles.BUSINESS_ANALYST]: ['product:export_data', 'user:edit'],
};

/**
 * Checks if a user has permission to perform a specific action.
 * This is the central source of truth for authorization checks.
 *
 * @param user The user performing the action.
 * @param action The action being performed.
 * @param resource Optional resource being acted upon for ownership checks.
 * @returns true if the user has permission, false otherwise.
 */
export function can(user: User, action: Action, resource?: any): boolean {
  // Global admin override
  if (hasRole(user, UserRoles.ADMIN)) {
    return true;
  }

  // Check role-based permissions from the matrix
  const hasBasePermission = user.roles.some(role =>
    permissionMatrix[role]?.includes(action),
  );

  if (!hasBasePermission) {
    return false;
  }

  // Handle resource-specific logic (ownership, status, etc.)
  if (action === 'product:edit' || action === 'product:archive' || action === 'product:recalculate' || action === 'product:validate_data' || action === 'product:run_prediction') {
    const product = resource as Product | undefined;
    return !!product && user.companyId === product.companyId;
  }

  if (action === 'product:delete') {
    const product = resource as Product | undefined;
    // Only allow deleting own products, and only if they are in 'Draft' status.
    return !!product && user.companyId === product.companyId && product.status === 'Draft';
  }

  if (action === 'user:edit') {
    const targetUser = resource as User | undefined;
    return !!targetUser && user.id === targetUser.id;
  }

  // If no specific resource logic is needed, the base permission is enough.
  return true;
}

/**
 * A helper function that throws a PermissionError if the user cannot perform the action.
 * @param user The user object.
 * @param action The action to check.
 * @param resource The resource the action is being performed on (optional).
 */
export function checkPermission(user: User, action: Action, resource?: any) {
  if (!can(user, action, resource)) {
    throw new PermissionError(
      `User role(s) '${user.roles.join(
        ', ',
      )}' cannot perform action '${action}'.`,
    );
  }
}
