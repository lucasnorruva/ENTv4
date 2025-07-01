// src/lib/auth-utils.ts
import type { User } from '@/types';
import type { Role } from '@/lib/constants';

/**
 * Checks if a user has a specific role.
 * This is a client-safe utility function.
 * @param user The user object.
 * @param role The role to check for.
 * @returns True if the user has the role, false otherwise.
 */
export function hasRole(user: User, role: Role): boolean {
  return user.roles.includes(role);
}
