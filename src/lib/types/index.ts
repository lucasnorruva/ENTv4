// src/types/index.ts
import type { Role } from '@/lib/constants';
import type {
  AnalyzeProductLifecycleOutput,
  ClassifyProductOutput,
  DataQualityWarning,
  EsgScoreOutput,
} from '@/types/ai-outputs';

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

// --- PRODUCT DATA STRUCTURES ---

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
export interface SustainabilityData extends EsgScoreOutput {
  classification?: ClassifyProductOutput;
  lifecycleAnalysis?: AnalyzeProductLifecycleOutput;
  isCompliant: boolean;
  complianceSummary: string;
  gaps?: ComplianceGap[];
}

/**
 * The core Digital Product Passport entity.
 */
export interface Product extends BaseEntity {
  companyId: string; // Foreign key to the Company
  productName: string;
  productDescription: string;
  productImage: string;
  category: string;
  supplier: string;
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string; // ISO 8601 date string for display purposes
  compliancePathId?: string;
  manualUrl?: string;

  // Structured Data Fields
  materials: Material[];
  manufacturing?: Manufacturing;
  certifications?: Certification[];
  packaging?: Packaging;

  // AI-Generated & Compliance Data
  sustainability?: SustainabilityData;
  qrLabelText?: string;
  dataQualityWarnings?: DataQualityWarning[];

  // Lifecycle & Verification
  lastVerificationDate?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Failed' | 'Not Submitted';
  endOfLifeStatus?: 'Active' | 'Recycled' | 'Disposed';
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
  regulations: string[];
  category: string;
  rules: {
    minSustainabilityScore?: number;
    requiredKeywords?: string[];
    bannedKeywords?: string[];
  };
}
