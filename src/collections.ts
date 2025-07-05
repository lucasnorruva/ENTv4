// src/lib/constants.ts

/**
 * Defines constants for Firestore collection names to ensure consistency
 * across the application.
 */
export const Collections = {
  PRODUCTS: 'products',
  COMPLIANCE_PATHS: 'compliancePaths',
  COMPANIES: 'companies',
  USERS: 'users',
  AUDIT_LOGS: 'auditLogs',
  WEBHOOKS: 'webhooks',
  API_KEYS: 'apiKeys',
  API_RATE_LIMITS: 'apiRateLimits',
  SERVICE_TICKETS: 'serviceTickets',
  SUPPORT_TICKETS: 'supportTickets',
  PRODUCTION_LINES: 'productionLines',
};

/**
 * Defines the standardized user roles within the Norruva platform.
 */
export const UserRoles = {
  ADMIN: 'Admin',
  SUPPLIER: 'Supplier',
  AUDITOR: 'Auditor',
  COMPLIANCE_MANAGER: 'Compliance Manager',
  MANUFACTURER: 'Manufacturer',
  SERVICE_PROVIDER: 'Service Provider',
  RECYCLER: 'Recycler',
  RETAILER: 'Retailer',
  DEVELOPER: 'Developer',
  BUSINESS_ANALYST: 'Business Analyst',
} as const;

/**
 * A type representing one of the possible user roles.
 */
export type Role = (typeof UserRoles)[keyof typeof UserRoles];

/**
 * A utility function to check if a user has a specific role.
 * This is a client-safe utility function.
 * @param user The user object.
 * @param role The role to check for.
 * @returns True if the user has the role, false otherwise.
 */
export function hasRole(user: { roles: Role[] }, role: Role): boolean {
  return user.roles.includes(role);
}
