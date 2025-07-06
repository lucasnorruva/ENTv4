// src/lib/schemas.ts
import { z } from 'zod';
import type { Role } from './constants';
import { UserRoles } from './constants';

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required.'),
  percentage: z.coerce.number().optional(),
  recycledContent: z.coerce.number().optional(),
  origin: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, 'Certificate name is required.'),
  issuer: z.string().min(1, 'Issuer is required.'),
  validUntil: z.string().optional(),
  documentUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

const manufacturingSchema = z.object({
  facility: z.string().min(1, 'Facility name is required.'),
  country: z.string().min(1, 'Country is required.'),
  emissionsKgCo2e: z.coerce.number().optional(),
});

const packagingSchema = z.object({
  type: z.string().min(1, 'Packaging type is required.'),
  recyclable: z.boolean(),
  recycledContent: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
});

const lifecycleSchema = z.object({
  carbonFootprint: z.coerce.number().optional(),
  carbonFootprintMethod: z.string().optional(),
  repairabilityScore: z.coerce.number().min(0).max(10).optional(),
  expectedLifespan: z.coerce.number().min(0).optional(),
  energyEfficiencyClass: z.string().optional(),
  recyclingInstructions: z.string().optional(),
});

const batterySchema = z.object({
  type: z.string().optional(),
  capacityMah: z.coerce.number().optional(),
  voltage: z.coerce.number().optional(),
  isRemovable: z.boolean().optional(),
});

const complianceSchema = z.object({
  rohs: z
    .object({
      compliant: z.boolean().optional(),
      exemption: z.string().optional(),
    })
    .optional(),
  reach: z
    .object({
      svhcDeclared: z.boolean().optional(),
      scipReference: z.string().optional(),
    })
    .optional(),
  weee: z
    .object({
      registered: z.boolean().optional(),
      registrationNumber: z.string().optional(),
    })
    .optional(),
  eudr: z
    .object({
      compliant: z.boolean().optional(),
      diligenceId: z.string().optional(),
    })
    .optional(),
  ce: z
    .object({
      marked: z.boolean().optional(),
    })
    .optional(),
  prop65: z
    .object({
      warningRequired: z.boolean().optional(),
    })
    .optional(),
  foodContact: z
    .object({
      safe: z.boolean().optional(),
      standard: z.string().optional(),
    })
    .optional(),
  battery: z
    .object({
      compliant: z.boolean().optional(),
      passportId: z.string().optional(),
    })
    .optional(),
  pfas: z
    .object({
      declared: z.boolean().optional(),
    })
    .optional(),
  conflictMinerals: z
    .object({
      compliant: z.boolean().optional(),
      reportUrl: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
  espr: z
    .object({
      compliant: z.boolean().optional(),
      delegatedActUrl: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});


export const customsInspectionFormSchema = z.object({
    status: z.enum(['Cleared', 'Detained', 'Rejected']),
    authority: z.string().min(3, 'Authority name is required.'),
    location: z.string().min(3, 'Inspection location is required.'),
    notes: z.string().optional(),
  });
export type CustomsInspectionFormValues = z.infer<typeof customsInspectionFormSchema>;

const customsStatusSchema = customsInspectionFormSchema.extend({
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  history: z.array(z.lazy(() => customsStatusSchema.omit({ history: true }))).optional(),
});

export const submissionChecklistSchema = z.object({
    hasBaseInfo: z.boolean(),
    hasMaterials: z.boolean(),
    hasManufacturing: z.boolean(),
    hasLifecycleData: z.boolean(),
    hasCompliancePath: z.boolean(),
    passesDataQuality: z.boolean(),
});

const transitInfoSchema = z.object({
  stage: z.string(),
  eta: z.string(),
  transport: z.enum(['Ship', 'Plane', 'Truck']),
  origin: z.string(),
  destination: z.string(),
});

const verificationOverrideSchema = z.object({
    reason: z.string(),
    userId: z.string(),
    date: z.string(),
});

export const textileDataSchema = z.object({
  fiberComposition: z.array(z.object({
    name: z.string().min(1, 'Fiber name is required.'),
    percentage: z.coerce.number().min(0).max(100),
  })).optional(),
  dyeProcess: z.string().optional(),
  weaveType: z.string().optional(),
});

const blockchainProofSchema = z.object({
  type: z.enum(['SINGLE_HASH', 'MERKLE_PROOF']),
  txHash: z.string(),
  explorerUrl: z.string().url(),
  blockHeight: z.number(),
  merkleRoot: z.string().optional(),
  proof: z.array(z.string()).optional(),
});

export const productFormSchema = z.object({
  gtin: z
    .string()
    .regex(
      /^\d{8}$|^\d{12,14}$/,
      'Invalid GTIN format. Must be 8, 12, 13, or 14 digits.',
    )
    .optional()
    .or(z.literal('')),
  productName: z.string().min(3, 'Product name must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  productImage: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  manualUrl: z.string().url().optional().or(z.literal('')),
  manualFileName: z.string().optional(),
  manualFileSize: z.number().optional(),
  model3dUrl: z.string().url().optional().or(z.literal('')),
  model3dFileName: z.string().optional(),
  declarationOfConformity: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  manufacturing: manufacturingSchema.optional(),
  certifications: z.array(certificationSchema).optional(),
  packaging: packagingSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  battery: batterySchema.optional(),
  customs: customsStatusSchema.optional(),
  transit: transitInfoSchema.optional(),
  submissionChecklist: submissionChecklistSchema.optional(),
  customData: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  verificationOverride: verificationOverrideSchema.optional(),
  textile: textileDataSchema.optional(),
  compliance: complianceSchema.optional(),
  blockchainProof: blockchainProofSchema.optional(),
  ebsiVcId: z.string().optional(),
  verifiableCredential: z.string().optional(),
  isProcessing: z.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const userFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  companyId: z.string().min(1, 'Company ID is required.'),
  roles: z
    .array(z.string())
    .refine(value => value.some(item => item), {
      message: 'You have to select at least one role.',
    }),
});
export type UserFormValues = z.infer<typeof userFormSchema>;

export const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  ownerId: z.string().min(1, 'Owner ID is required.'),
  industry: z.string().optional(),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  isTrustedIssuer: z.boolean().optional(),
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

const customFieldDefinitionSchema = z.object({
  id: z.string().min(1, 'ID is required').regex(/^[a-z0-9_]+$/, 'ID must be lowercase with underscores.'),
  label: z.string().min(1, 'Label is required.'),
  type: z.enum(['text', 'number', 'boolean']),
});

export const companySettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  apiAccess: z.boolean().optional(),
  brandingCustomization: z.boolean().optional(),
  theme: z
    .object({
      light: z
        .object({
          primary: z.string().optional(),
          accent: z.string().optional(),
        })
        .optional(),
      dark: z
        .object({
          primary: z.string().optional(),
          accent: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  customFields: z.array(customFieldDefinitionSchema).optional(),
});
export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z.array(z.object({ value: z.string().min(1, "Regulation cannot be empty.") })).min(1, "At least one regulation is required."),
  minSustainabilityScore: z.coerce.number().min(0).max(100).optional(),
  requiredKeywords: z.array(z.object({ value: z.string() })).optional(),
  bannedKeywords: z.array(z.object({ value: z.string() })).optional(),
});
export type CompliancePathFormValues = z.infer<
  typeof compliancePathFormSchema
>;

export const webhookFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  events: z
    .array(z.string())
    .min(1, { message: 'You must select at least one event type.' }),
  status: z.enum(['active', 'inactive']),
});
export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

export const apiKeyFormSchema = z.object({
  label: z.string().min(3, 'Label must be at least 3 characters.'),
  scopes: z
    .array(z.string())
    .min(1, { message: 'You must select at least one scope.' }),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const serviceTicketFormSchema = z.object({
  productId: z.string().optional(),
  productionLineId: z.string().optional(),
  customerName: z.string().min(2, 'Customer name is required.'),
  issue: z
    .string()
    .min(10, 'Issue description must be at least 10 characters.'),
  status: z.enum(['Open', 'In Progress', 'Closed']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;

export const supportTicketFormSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z
    .string()
    .min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z
    .string()
    .min(20, { message: 'Message must be at least 20 characters.' }),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const productionLineFormSchema = z.object({
  name: z.string().min(3, 'Line name must be at least 3 characters.'),
  location: z.string().min(3, 'Location is required.'),
  status: z.enum(['Active', 'Idle', 'Maintenance']),
  outputPerHour: z.coerce
    .number()
    .int()
    .min(0, 'Output must be a positive number.'),
  productId: z.string().optional(),
});
export type ProductionLineFormValues = z.infer<
  typeof productionLineFormSchema
>;

export const bulkProductImportSchema = z.object({
  productName: z.string().min(3, 'productName must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'productDescription must be at least 10 characters.'),
  gtin: z
    .string()
    .regex(/^\d{8}$|^\d{12,14}$/, 'Invalid GTIN format')
    .optional()
    .or(z.literal('')),
  category: z.string().min(1, 'category is required.'),
  productImage: z.string().url().optional().or(z.literal('')),
  manualUrl: z.string().url().optional().or(z.literal('')),
  // Note: Materials can be a stringified JSON in the CSV
  materials: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        return z.array(materialSchema).parse(parsed);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON format for materials.',
        });
        return z.NEVER;
      }
    }),
});

export type BulkProductImportValues = z.infer<typeof bulkProductImportSchema>;

export const bulkUserImportSchema = z.object({
  fullName: z.string().min(2, 'fullName is required.'),
  email: z.string().email('Invalid email address.'),
  roles: z.string().min(1, 'At least one role is required.').transform((val, ctx) => {
    const roles = val.split(',').map(r => r.trim());
    const validRoles = Object.values(UserRoles);
    for (const role of roles) {
        if (!validRoles.includes(role as Role)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Invalid role: ${role}`,
            });
            return z.NEVER;
        }
    }
    return roles as Role[];
  }),
});

export type BulkUserImportValues = z.infer<typeof bulkUserImportSchema>;

export const onboardingFormSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters.'),
  industry: z.string().optional(),
});
export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const apiSettingsSchema = z.object({
  isPublicApiEnabled: z.boolean(),
  rateLimits: z.object({
    free: z.coerce.number().int().min(0),
    pro: z.coerce.number().int().min(0),
    enterprise: z.coerce.number().int().min(0),
  }),
  isWebhookSigningEnabled: z.boolean(),
});
export type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export const overrideVerificationSchema = z.object({
  reason: z.string().min(10, { message: "A justification reason is required (min 10 characters)." }),
});
export type OverrideVerificationFormValues = z.infer<typeof overrideVerificationSchema>;
