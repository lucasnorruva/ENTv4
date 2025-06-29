// src/types/index.ts
import type { Role } from '@/lib/constants';

/**
 * A base interface for all Firestore documents, ensuring consistent
 * ID and timestamp fields.
 */
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

/**
 * Represents a user account in the system.
 */
export interface User extends BaseEntity {
  email: string;
  fullName: string;
  companyId: string;
  roles: Role[];
}

/**
 * Represents a company or organization in the multi-tenant system.
 */
export interface Company extends BaseEntity {
  name: string;
  ownerId: string; // ID of the user who created the company
}

/**
 * The core Digital Product Passport entity.
 */
export interface Product extends BaseEntity {
  productName: string;
  productDescription: string;
  productImage: string;
  category: string;
  supplier: string;
  complianceLevel: 'High' | 'Medium' | 'Low';
  currentInformation: string; // A stringified JSON object with passport data
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string; // ISO 8601 date string for display purposes
  sustainabilityScore?: number;
  sustainabilityReport?: string;
  lastVerificationDate?: string; // ISO 8601 format
  verificationStatus?: 'Verified' | 'Pending' | 'Failed';
  endOfLifeStatus?: 'Active' | 'Recycled' | 'Disposed';
}

/**
 * Defines a set of compliance rules and regulations.
 */
export interface CompliancePath extends BaseEntity {
  name: string;
  description: string;
  regulations: string[]; // e.g., ['ESPR', 'CSRD']
  category: string; // The product category this path applies to
  rules: {
    minSustainabilityScore?: number;
    requiredKeywords?: string[];
    bannedKeywords?: string[];
  };
}

/**
 * Represents a supplier in the supply chain.
 */
export interface Supplier extends BaseEntity {
  name: string;
  contactEmail: string;
  companyId: string;
}

/**
 * Represents a verification or audit event for a product.
 */
export interface Verification extends BaseEntity {
  productId: string;
  auditorId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes: string;
  verificationDate: string; // ISO 8601 format
}

/**
 * Logs significant actions taken within the system for auditing purposes.
 */
export interface AuditLog extends BaseEntity {
  userId: string; // Can be 'system' for automated actions
  action: string; // e.g., 'product.create', 'verification.approve'
  entityId: string;
  details: Record<string, any>; // Stores before/after states for changes
}

/**
 * Configuration for a webhook to notify external systems of events.
 */
export interface Webhook extends BaseEntity {
  url: string;
  events: string[]; // e.g., ['product.published', 'verification.approved']
  companyId: string;
}
