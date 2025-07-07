// src/types/index.ts
import type { Role } from '@/lib/constants';
import type {
  AnalyzeProductLifecycleOutput,
  ClassifyProductOutput,
  DataQualityWarning,
  EsgScoreOutput,
  PredictLifecycleOutput,
  AnalyzeTextileOutput,
  AnalyzeConstructionMaterialOutput,
} from '@/types/ai-outputs';
import type { ErpProduct as ErpProductType } from '@/services/mock-erp';
import type { TransitInfo, CustomsAlert, CustomsStatus } from './transit';

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
  avatarUrl?: string;
  companyId: string;
  roles: Role[];
  onboardingComplete: boolean;
  isMfaEnabled: boolean;
  readNotificationIds?: string[];
  circularityCredits?: number;
  notificationPreferences?: {
    productUpdates: boolean;
    complianceAlerts: boolean;
    platformNews: boolean;
  };
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

export interface ModelHotspot {
  position: { x: number; y: number; z: number };
  label: string;
  description: string;
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

export interface GreenClaim {
  claim: string;
  substantiation: string;
}

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
  epr?: {
    schemeId?: string;
    producerRegistrationNumber?: string;
    wasteCategory?: string;
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
  greenClaims?: GreenClaim[];
  modelHotspots?: ModelHotspot[];

  // AI-Generated & Compliance Data
  sustainability?: SustainabilityData;
  qrLabelText?: string;
  dataQualityWarnings?: DataQualityWarning[];
  isProcessing?: boolean;
  submissionChecklist?: SubmissionChecklist;
  textileAnalysis?: TextileAnalysis;
  constructionAnalysis?: AnalyzeConstructionMaterialOutput;

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
  productId?: string;
  productionLineId?: string;
  userId: string;
  customerName: string;
  issue: string;
  status: 'Open' | 'In Progress' | 'Closed';
  imageUrl?: string;
}

/**
 * Represents a platform support ticket submitted by a user.
 */
export interface SupportTicket extends BaseEntity {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'Open' | 'Closed';
  userId?: string; // Optional, for logged-in users
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
  productId?: string;
  companyId: string; // Foreign key to the Company
}

/**
 * Represents a developer API key for integrations.
 */
export interface ApiKey extends BaseEntity {
  label: string;
  token: string; // This is a truncated, non-sensitive version for display
  rawToken?: string; // MOCK ONLY: In a real app, this would be hashed.
  status: 'Active' | 'Revoked';
  userId: string;
  scopes: string[];
  lastUsed?: string;
}

/**
 * Represents a configurable webhook endpoint for integrations.
 */
export interface Webhook extends BaseEntity {
  url: string;
  events: string[]; // e.g., ['product.published', 'product.updated']
  status: 'active' | 'inactive';
  userId: string;
}

/**
 * Represents the global settings for the Norruva API.
 */
export interface ApiSettings {
  isPublicApiEnabled: boolean;
  rateLimits: {
    free: number;
    pro: number;
    enterprise: number;
  };
  isWebhookSigningEnabled: boolean;
}

/**
 * Represents a configurable integration with an external system.
 */
export interface Integration extends BaseEntity {
  name: string;
  type: 'ERP' | 'PLM' | 'E-commerce';
  logo: string;
  dataAiHint: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Represents a document in Firestore used for API rate limiting.
 */
export interface ApiRateLimit {
  count: number;
  windowStart: number; // Unix timestamp (in seconds) for the start of the window
}

export type { TransitInfo, CustomsAlert, CustomsStatus };

export interface SimulatedRoute {
  origin: string;
  destination: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  summary: string;
  keyConsiderations: string[];
}
