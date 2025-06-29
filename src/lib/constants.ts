// src/lib/constants.ts

/**
 * Defines constants for Firestore collection names to ensure consistency
 * across the application.
 */
export const Collections = {
  PRODUCTS: 'products',
  COMPLIANCE_PATHS: 'compliancePaths',
  SUPPLIERS: 'suppliers',
  VERIFICATIONS: 'verifications',
  USERS: 'users',
  COMPANIES: 'companies',
  AUDIT_LOGS: 'auditLogs',
  WEBHOOKS: 'webhooks'
} as const;

/**
 * Defines the standardized user roles within the Norruva platform.
 */
export const UserRoles = {
  ADMIN: 'Admin',
  SUPPLIER: 'Supplier',
  AUDITOR: 'Auditor',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  MANUFACTURER: 'Manufacturer',
  SERVICE_PROVIDER: 'Service Provider',
  RECYCLER: 'Recycler',
  DEVELOPER: 'Developer'
} as const;

/**
 * A type representing one of the possible user roles.
 */
export type Role = typeof UserRoles[keyof typeof UserRoles];
