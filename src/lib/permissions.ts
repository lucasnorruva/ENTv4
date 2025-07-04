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
  | 'product:add_service_record'
  | 'product:validate_data'
  | 'product:run_compliance'
  | 'compliance:manage'
  | 'user:manage'
  | 'user:edit'
  | 'user:change_password'
  | 'company:manage'
  | 'developer:manage_api'
  | 'admin:manage_settings'
  | 'ticket:create'
  | 'ticket:manage'
  | 'ticket:view_all'
  | 'support:manage'
  | 'manufacturer:manage_lines'
  | 'integration:sync';

/**
 * Checks if a user has permission to perform a specific action.
 * @param user The user performing the action.
 * @param action The action being performed.
 * @param resource Optional resource being acted upon (e.g., a Product or another User).
 * @returns true if the user has permission, false otherwise.
 */
export function can(user: User, action: Action, resource?: any): boolean {
  // Admins can do anything.
  if (hasRole(user, UserRoles.ADMIN)) {
    return true;
  }

  const product = resource as Product | undefined;
  const targetUser = resource as User | undefined;

  const isOwner = product ? user.companyId === product.companyId : false;
  const isSelf = targetUser ? user.id === targetUser.id : false;

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
    case 'product:validate_data':
    case 'product:run_compliance':
      return product ? isOwner && hasRole(user, UserRoles.SUPPLIER) : false;

    case 'product:approve':
    case 'product:reject':
      return hasRole(user, UserRoles.AUDITOR);

    case 'product:resolve':
      return hasRole(user, UserRoles.COMPLIANCE_MANAGER);

    case 'product:recycle':
      return hasRole(user, UserRoles.RECYCLER);

    case 'product:add_service_record':
      return hasRole(user, UserRoles.SERVICE_PROVIDER);

    case 'compliance:manage':
      return (
        hasRole(user, UserRoles.COMPLIANCE_MANAGER) ||
        hasRole(user, UserRoles.AUDITOR)
      );

    case 'user:manage':
    case 'company:manage':
    case 'admin:manage_settings':
      return hasRole(user, UserRoles.ADMIN); // Handled by global admin check, but explicit here.

    case 'user:edit':
      return isSelf;

    case 'user:change_password':
      return isSelf;

    case 'developer:manage_api':
      return hasRole(user, UserRoles.DEVELOPER);

    case 'ticket:create':
    case 'ticket:manage':
      return (
        hasRole(user, UserRoles.SERVICE_PROVIDER) ||
        hasRole(user, UserRoles.MANUFACTURER)
      );

    case 'ticket:view_all':
      return hasRole(user, UserRoles.ADMIN);

    case 'support:manage':
      return hasRole(user, UserRoles.ADMIN);

    case 'manufacturer:manage_lines':
      return hasRole(user, UserRoles.MANUFACTURER);
    
    case 'integration:sync':
        return hasRole(user, UserRoles.DEVELOPER);

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
    throw new PermissionError(
      `User role(s) '${user.roles.join(
        ', ',
      )}' cannot perform action '${action}'.`,
    );
  }
}
