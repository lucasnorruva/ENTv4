// src/types/index.ts
import type { Role } from '@/lib/constants';
import type {
  AnalyzeProductLifecycleOutput,
  ClassifyProductOutput,
  DataQualityWarning,
  EsgScoreOutput,
  PredictLifecycleOutput,
  AnalyzeTextileOutput,
} from '@/types/ai-outputs';
import type { ErpProduct as ErpProductType } from '@/services/mock-erp';
import type { TransitInfo, CustomsAlert } from './transit';


export * from './transit';

// Re-exporting for easy access elsewhere
export type ErpProduct = ErpProductType;

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
  onboardingComplete: boolean;
  isMfaEnabled: boolean;
  readNotificationIds?: string[];
  circularityCredits?: number;
}

export interface CustomFieldDefinition {
  id: string; // e.g., 'internal_sku'
  label: string; // e.g., 'Internal SKU'
  type: 'text' | 'number' | 'boolean';
}

/**
 * Represents a company or organization in the multi-tenant system.
 */
export interface Company extends BaseEntity {
  name: string;
  ownerId: string; // ID of the user who created the company
  industry?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  isTrustedIssuer?: boolean;
  revocationListUrl?: string;
  settings?: {
    aiEnabled?: boolean;
    apiAccess?: boolean;
    brandingCustomization?: boolean;
    theme?: {
      light?: {
        primary?: string;
        accent?: string;
      };
      dark?: {
        primary?: string;
        accent?: string;
      };
    };
    customFields?: CustomFieldDefinition[];
  };
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
  energyEfficiencyClass?: string;
  recyclingInstructions?: string;
}

export interface Battery {
  type?: string;
  capacityMah?: number;
  voltage?: number;
  isRemovable?: boolean;
}

export interface TextileData {
  fiberComposition?: { name: string; percentage: number }[];
  dyeProcess?: string;
  weaveType?: string;
}

export interface TextileAnalysis extends AnalyzeTextileOutput {}

export interface Compliance {
  rohs?: {
    compliant?: boolean;
    exemption?: string;
  };
  reach?: {
    svhcDeclared?: boolean;
    scipReference?: string;
  };
  weee?: {
    registered?: boolean;
    registrationNumber?: string;
  };
  eudr?: {
    compliant?: boolean;
    diligenceId?: string;
  };
  ce?: {
    marked?: boolean;
  };
  prop65?: {
    warningRequired?: boolean;
  };
  foodContact?: {
    safe?: boolean;
    standard?: string;
  };
  battery?: {
    compliant?: boolean;
    passportId?: string;
  };
  pfas?: {
    declared?: boolean;
  };
  conflictMinerals?: {
    compliant?: boolean;
    reportUrl?: string;
  };
  espr?: {
    compliant?: boolean;
    delegatedActUrl?: string;
  };
}

export interface ComplianceGap {
  regulation: string;
  issue: string;
}

/**
 * Represents a single service or repair record.
 */
export interface ServiceRecord extends BaseEntity {
  providerId: string;
  providerName: string;
  notes: string;
}

export interface CustomsStatus {
  status: 'Cleared' | 'Detained' | 'Rejected';
  authority: string;
  location: string;
  date: string; // ISO 8601 format
  notes?: string;
  history?: Omit<CustomsStatus, 'history'>[];
}

/**
 * Groups all AI-generated and compliance-related data.
 */
export interface SustainabilityData extends EsgScoreOutput {
  classification?: ClassifyProductOutput;
  lifecycleAnalysis?: AnalyzeProductLifecycleOutput;
  lifecyclePrediction?: PredictLifecycleOutput;
  isCompliant: boolean;
  complianceSummary: string;
  gaps?: ComplianceGap[];
  completenessScore?: number;
}

/**
 * Represents the checklist for submission readiness.
 */
export interface SubmissionChecklist {
  hasBaseInfo: boolean;
  hasMaterials: boolean;
  hasManufacturing: boolean;
  hasLifecycleData: boolean;
  hasCompliancePath: boolean;
  passesDataQuality: boolean;
}

export interface BlockchainProof {
  type: 'SINGLE_HASH' | 'MERKLE_PROOF';
  txHash: string;
  explorerUrl: string;
  blockHeight: number;
  merkleRoot?: string;
  proof?: string[]; // Array of hashes for Merkle proof
}

export interface ZkProof {
  proofData: string; // Mock proof data
  isVerified: boolean;
  verifiedAt: string; // ISO 8601
}

/**
 * The core Digital Product Passport entity.
 */
export interface Product extends BaseEntity {
  companyId: string; // Foreign key to the Company
  gtin?: string;
  productName: string;
  productDescription: string;
  productImage: string;
  category: string;
  supplier: string;
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string; // ISO 8601 date string for display purposes
  compliancePathId?: string;
  manualUrl?: string;
  manualFileName?: string;
  manualFileSize?: number;
  model3dUrl?: string;
  model3dFileName?: string;
  declarationOfConformity?: string;

  // Structured Data Fields
  materials: Material[];
  manufacturing?: Manufacturing;
  certifications?: Certification[];
  packaging?: Packaging;
  lifecycle?: Lifecycle;
  battery?: Battery;
  serviceHistory?: ServiceRecord[];
  customs?: CustomsStatus;
  transit?: TransitInfo;
  customData?: Record<string, string | number | boolean>;
  textile?: TextileData;
  compliance?: Compliance;

  // AI-Generated & Compliance Data
  sustainability?: SustainabilityData;
  qrLabelText?: string;
  dataQualityWarnings?: DataQualityWarning[];
  isProcessing?: boolean;
  submissionChecklist?: SubmissionChecklist;
  textileAnalysis?: TextileAnalysis;

  // Lifecycle & Verification
  lastVerificationDate?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Failed' | 'Not Submitted';
  verificationOverride?: {
    reason: string;
    userId: string;
    date: string;
  };
  endOfLifeStatus?: 'Active' | 'Recycled' | 'Disposed';
  blockchainProof?: BlockchainProof;
  zkProof?: ZkProof;
  verifiableCredential?: any; // The signed VC object
  ebsiVcId?: string;
}
