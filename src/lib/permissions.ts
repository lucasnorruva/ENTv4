// src/lib/permissions.ts
import type { User, Product } from '@/types';
import { hasRole } from './auth-utils';
import { UserRoles } from './constants';

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

export type Action =
  | 'product:create'
  | 'product:edit'
  | 'product:delete'
  | 'product:archive'
  | 'product:submit'
  | 'product:approve'
  | 'product:reject'
  | 'product:recalculate'
  | 'product:recycle'
  | 'product:resolve'
  | 'compliance:manage'
  | 'user:manage'
  | 'company:manage';

/**
 * Checks if a user has permission to perform a specific action.
 * @param user The user performing the action.
 * @param action The action being performed.
 * @param resource Optional resource being acted upon (e.g., a Product).
 * @returns true if the user has permission, false otherwise.
 */
export function can(user: User, action: Action, resource?: any): boolean {
  // Admins can do anything.
  if (hasRole(user, UserRoles.ADMIN)) {
    return true;
  }

  const product = resource as Product | undefined;
  const isOwner = product ? user.companyId === product.companyId : false;

  switch (action) {
    case 'product:create':
      return hasRole(user, UserRoles.SUPPLIER);

    case 'product:edit':
      return product ? isOwner && hasRole(user, UserRoles.SUPPLIER) : false;

    case 'product:delete':
      return product
        ? isOwner &&
            hasRole(user, UserRoles.SUPPLIER) &&
            product.status === 'Draft'
        : false;

    case 'product:archive':
      return product
        ? isOwner &&
            (hasRole(user, UserRoles.SUPPLIER) ||
              hasRole(user, UserRoles.COMPLIANCE_MANAGER))
        : false;

    case 'product:submit':
    case 'product:recalculate':
      return product ? isOwner && hasRole(user, UserRoles.SUPPLIER) : false;

    case 'product:approve':
    case 'product:reject':
      return hasRole(user, UserRoles.AUDITOR);
    
    case 'product:resolve':
      return hasRole(user, UserRoles.COMPLIANCE_MANAGER);
      
    case 'product:recycle':
      return hasRole(user, UserRoles.RECYCLER);

    case 'compliance:manage':
      return hasRole(user, UserRoles.COMPLIANCE_MANAGER) || hasRole(user, UserRoles.AUDITOR);
      
    case 'user:manage':
    case 'company:manage':
      return hasRole(user, UserRoles.ADMIN); // Handled by global admin check, but explicit here.

    default:
      return false;
  }
}

/**
 * A helper function that throws a PermissionError if the user cannot perform the action.
 * @param user The user object.
 * @param action The action to check.
 * @param resource The resource the action is being performed on (optional).
 */
export function checkPermission(user: User, action: Action, resource?: any) {
  if (!can(user, action, resource)) {
    throw new PermissionError(`User role(s) '${user.roles.join(', ')}' cannot perform action '${action}'.`);
  }
}
