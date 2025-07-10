// src/types/index.ts
import type { Role } from '@/lib/constants';
import type {
  AnalyzeProductLifecycleOutput,
  ClassifyProductOutput,
  DataQualityWarning,
  EsgScoreOutput,
  PredictLifecycleOutput,
  AnalyzeTextileOutput,
  AnalyzeElectronicsComplianceOutput,
  AnalyzeConstructionMaterialOutput,
  AnalyzeFoodSafetyOutput,
  HsCodeAnalysis,
  ProductTransitRiskAnalysis,
} from '@/types/ai-outputs';
import type { ErpProduct as ErpProductType } from '@/services/mock-erp';
import type { TransitInfo, CustomsAlert, CustomsStatus, SimulatedRoute } from './transit';
import type { ModelHotspot } from './3d';
import type { Integration as IntegrationType } from './integrations';


// Re-exporting for easy access elsewhere
export type ErpProduct = ErpProductType;
export type { TransitInfo, CustomsAlert, CustomsStatus, SimulatedRoute, ModelHotspot, ProductTransitRiskAnalysis, HsCodeAnalysis };
export type ConstructionAnalysis = AnalyzeConstructionMaterialOutput;
export type ElectronicsAnalysis = AnalyzeElectronicsComplianceOutput;
export type FoodSafetyAnalysis = AnalyzeFoodSafetyOutput;
export type TextileAnalysis = AnalyzeTextileOutput;
export type Integration = IntegrationType;


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
  notificationPreferences?: {
    productUpdates?: boolean;
    complianceAlerts?: boolean;
    platformNews?: boolean;
  };
  circularityCredits?: number;
}

/**
 * Represents a company or organization in the multi-tenant system.
 */
export interface Company extends BaseEntity {
  name: string;
  ownerId: string; // ID of the user who created the company
  industry?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  isTrustedIssuer: boolean;
  revocationListUrl?: string;
  settings?: {
    aiEnabled: boolean;
    apiAccess: boolean;
    brandingCustomization: boolean;
    logoUrl?: string;
    logoFileName?: string;
    theme?: {
      light: { primary: string; accent: string };
      dark: { primary: string; accent: string };
    };
    customFields?: CustomFieldDefinition[];
  };
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
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
  manufacturingProcess?: string;
  emissionsKgCo2e?: number;
}

export interface Packaging {
  type: string;
  recycledContent?: number;
  recyclable: boolean;
  weight?: number;
}

export interface Lifecycle {
  carbonFootprint?: number; // in kg CO2-eq
  carbonFootprintMethod?: string;
  repairabilityScore?: number; // scale of 1-10
  expectedLifespan?: number; // in years
  recyclingInstructions?: string;
  energyEfficiencyClass?: string;
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

export interface FoodSafetyData {
  ingredients: { value: string }[];
  allergens?: string;
}

export interface GreenClaim {
  claim: string;
  substantiation: string;
}

export interface MassBalance {
  creditsAllocated?: number;
  certificationBody?: string;
  certificateNumber?: string;
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
  cbam?: {
    emissionsReported?: boolean;
    declarationId?: string;
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

export interface ZkProof {
  proofData: string;
  isVerified: boolean;
  verifiedAt: string;
}

export interface VerificationOverride {
  userId: string;
  reason: string;
  date: string;
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
  category: 'Electronics' | 'Fashion' | 'Home Goods' | 'Construction' | 'Food & Beverage';
  supplier: string;
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string; // ISO 8601 date string for display purposes
  compliancePathId?: string;
  manualUrl?: string;
  manualFileName?: string;
  manualFileSize?: number;
  manualFileHash?: string;
  model3dUrl?: string;
  model3dFileName?: string;
  model3dFileHash?: string;
  modelHotspots?: ModelHotspot[];
  declarationOfConformity?: string;
  sustainabilityDeclaration?: string;
  verifiableCredential?: string;
  ebsiVcId?: string;
  zkProof?: ZkProof;
  ownershipNft?: {
    tokenId: string;
    contractAddress: string;
    ownerAddress: string;
  };
  chainOfCustody?: {
    date: string;
    event: string;
    location: string;
    actor: string;
  }[];
  ebsiDetails?: {
    status: 'Verified' | 'Pending' | 'Failed';
    conformanceResultUrl?: string;
  };
  
  // Structured Data Fields
  materials: Material[];
  manufacturing?: Manufacturing;
  certifications?: Certification[];
  packaging?: Packaging;
  lifecycle?: Lifecycle;
  battery?: Battery;
  serviceHistory?: ServiceRecord[];
  customData?: Record<string, string | number | boolean>;
  textile?: TextileData;
  foodSafety?: FoodSafetyData;
  greenClaims?: GreenClaim[];
  massBalance?: MassBalance;
  constructionAnalysis?: ConstructionAnalysis;
  electronicsAnalysis?: ElectronicsAnalysis;
  textileAnalysis?: TextileAnalysis;
  foodSafetyAnalysis?: FoodSafetyAnalysis;
  transitRiskAnalysis?: ProductTransitRiskAnalysis;
  hsCodeAnalysis?: HsCodeAnalysis;

  // AI-Generated & Compliance Data
  sustainability?: SustainabilityData;
  qrLabelText?: string;
  dataQualityWarnings?: DataQualityWarning[];
  isProcessing?: boolean;
  submissionChecklist?: SubmissionChecklist;

  // Lifecycle & Verification
  lastVerificationDate?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Failed' | 'Not Submitted';
  verificationOverride?: VerificationOverride;
  endOfLifeStatus?: 'Active' | 'Recycled' | 'Disposed';
  blockchainProof?: BlockchainProof;
  isMinting?: boolean;
  transit?: TransitInfo;
  customs?: CustomsStatus;
}

/**
 * Defines a set of compliance rules and regulations.
 */
export interface CompliancePath extends BaseEntity {
  name: string;
  description: string;
  regulations: string[];
  category: string;
  jurisdiction: string;
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

export interface SupportTicket extends BaseEntity {
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'Open' | 'Closed';
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
  expiresAt?: string; // ISO 8601 date string
  ipRestrictions?: string[];
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
 * Represents the global settings for the API.
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
 * Represents a rate limit counter for a specific key.
 */
export interface ApiRateLimit {
  tokens: number;
  lastRefilled: number; // Unix timestamp
}

/**
 * Represents a production line in a manufacturing facility.
 */
export interface ProductionLine extends BaseEntity {
  companyId: string;
  name: string;
  location: string;
  status: 'Active' | 'Idle' | 'Maintenance';
  outputPerHour: number;
  currentProduct: string;
  productId?: string;
  lastMaintenance: string; // ISO 8601 string
}

export interface BlockchainProof {
  type: 'SINGLE_HASH' | 'MERKLE_PROOF';
  chain: 'Polygon' | 'EBSI' | 'Hyperledger';
  txHash: string;
  explorerUrl: string;
  blockHeight: number;
  merkleRoot?: string;
  proof?: string[]; // Array of hashes for Merkle proof
}
