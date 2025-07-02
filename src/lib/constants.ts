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
  SERVICE_TICKETS: 'serviceTickets',
  PRODUCTION_LINES: 'productionLines',
} as const;

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
