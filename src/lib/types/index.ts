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
  readNotificationIds?: string[];
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
  weight?: number; // in grams
}

export interface Lifecycle {
  carbonFootprint?: number; // in kg CO2-eq
  carbonFootprintMethod?: string;
  repairabilityScore?: number; // scale of 1-10
  expectedLifespan?: number; // in years
}

export interface Battery {
  type?: string;
  capacityMah?: number;
  voltage?: number;
  isRemovable?: boolean;
}

export interface Compliance {
  rohsCompliant?: boolean;
  rohsExemption?: string;
  reachSVHC?: boolean;
  scipReference?: string;
  prop65WarningRequired?: boolean;
  ceMarked?: boolean;
  foodContactSafe?: boolean;
  foodContactComplianceStandard?: string;
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
  conformityDocUrl?: string;

  // Structured Data Fields
  materials: Material[];
  manufacturing?: Manufacturing;
  certifications?: Certification[];
  packaging?: Packaging;
  lifecycle?: Lifecycle;
  battery?: Battery;
  compliance?: Compliance;

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

/**
 * Represents a single audit trail event in the system.
 */
export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  entityId: string;
  details: Record<string, any>;
}

/**
 * Represents a service ticket for product repair or issues.
 */
export interface ServiceTicket extends BaseEntity {
  productId: string;
  userId: string;
  customerName: string;
  issue: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

/**
 * Represents a physical production line for manufacturing.
 */
export interface ProductionLine extends BaseEntity {
  name: string;
  location: string;
  status: 'Active' | 'Idle' | 'Maintenance';
  outputPerHour: number;
  currentProduct: string;
  lastMaintenance: string;
}

/**
 * Represents a developer API key for integrations.
 */
export interface ApiKey extends BaseEntity {
  label: string;
  token: string; // This is a truncated, non-sensitive version for display
  status: 'Active' | 'Revoked';
  userId: string;
  lastUsed?: string;
}

/**
 * Represents the global settings for the Norruva API.
 */
export interface ApiSettings {
  isPublicApiEnabled: boolean;
  rateLimitPerMinute: number;
  isWebhookSigningEnabled: boolean;
}
