// src/types/index.ts
import type { Role, UserRoles } from "@/lib/constants";
import type {
  AnalyzeProductLifecycleOutput,
  EsgScoreOutput,
  ClassifyProductOutput,
  SummarizeComplianceGapsOutput,
  DataQualityWarning,
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
  roles: (UserRoles[keyof typeof UserRoles])[];
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

export interface ComplianceGap {
  regulation: string;
  issue: string;
}

/**
 * Groups all AI-generated and compliance-related data.
 */
export interface SustainabilityData
  extends Omit<EsgScoreOutput, "summary">,
    Omit<SummarizeComplianceGapsOutput, "gaps"> {
  summary?: string;
  gaps?: ComplianceGap[];
}

/**
 * The core Digital Product Passport entity, now with a structured data model.
 */
export interface Product extends BaseEntity {
  companyId: string; // Foreign key to the Company
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
  dataQualityWarnings?: DataQualityWarning[];

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
