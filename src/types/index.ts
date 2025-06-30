// src/types/index.ts
import type { Role } from "@/lib/constants";
import type {
  AnalyzeProductLifecycleOutput,
  EsgScoreOutput,
  ClassifyProductOutput,
  SummarizeComplianceGapsOutput,
} from "@/types/ai-outputs";

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

// --- NEW STRUCTURED DATA SCHEMAS ---

export interface Material {
  name: string;
  percentage?: number;
  recycledContent?: number;
  origin?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  validUntil?: string;
  documentUrl?: string;
}

export interface Manufacturing {
  facility: string;
  country: string;
  emissionsKgCo2e?: number;
}

export interface Packaging {
  type: string;
  recycledContent?: number;
  recyclable: boolean;
}

/**
 * Groups all AI-generated and compliance-related data.
 */
export interface SustainabilityData
  extends EsgScoreOutput,
    SummarizeComplianceGapsOutput {
  lifecycleAnalysis?: AnalyzeProductLifecycleOutput;
  classification?: ClassifyProductOutput;
}

/**
 * The core Digital Product Passport entity, now with a structured data model.
 */
export interface Product extends BaseEntity {
  productName: string;
  productDescription: string;
  productImage: string;
  category: string;
  supplier: string;
  status: "Published" | "Draft" | "Archived";
  lastUpdated: string; // ISO 8601 date string for display purposes
  compliancePathId?: string;
  manualUrl?: string;

  // Structured Data Fields
  materials: Material[];
  manufacturing: Manufacturing;
  certifications: Certification[];
  packaging: Packaging;

  // AI-Generated & Compliance Data
  sustainability?: SustainabilityData;
  qrLabelText?: string; // AI-generated consumer-friendly summary

  // Lifecycle & Verification
  lastVerificationDate?: string; // ISO 8601 format
  verificationStatus?: "Verified" | "Pending" | "Failed" | "Not Submitted";
  endOfLifeStatus?: "Active" | "Recycled" | "Disposed";
  blockchainProof?: {
    txHash: string;
    explorerUrl: string;
    blockHeight: number;
  };
  ebsiVcId?: string;
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
  status: "Pending" | "Approved" | "Rejected";
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

/**
 * Represents a manufacturing production line.
 */
export interface ProductionLine {
  id: string;
  name: string;
  location: string;
  status: "Active" | "Idle" | "Maintenance";
  outputPerHour: number;
  currentProduct: string; // Product name
  lastMaintenance: string; // ISO 8601 date string
}

/**
 * Represents a service or repair ticket for a product.
 */
export interface ServiceTicket {
  id: string;
  productId: string;
  customerName: string;
  issue: string;
  status: "Open" | "In Progress" | "Closed";
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}
