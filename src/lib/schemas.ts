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
  rohsCompliant: z.boolean().optional(),
  rohsExemption: z.string().optional(),
  reachSVHC: z.boolean().optional(),
  scipReference: z.string().optional(),
  weeeRegistered: z.boolean().optional(),
  weeeRegistrationNumber: z.string().optional(),
  prop65WarningRequired: z.boolean().optional(),
  eudrCompliant: z.boolean().optional(),
  eudrDiligenceId: z.string().optional(),
  ceMarked: z.boolean().optional(),
  foodContactSafe: z.boolean().optional(),
  foodContactComplianceStandard: z.string().optional(),
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
  conformityDocUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required.'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  manualUrl: z.string().url().optional().or(z.literal('')),
  materials: z.array(materialSchema).optional(),
  manufacturing: manufacturingSchema.optional(),
  certifications: z.array(certificationSchema).optional(),
  packaging: packagingSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  battery: batterySchema.optional(),
  compliance: complianceSchema.optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const userFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  companyId: z.string().min(1, 'Company ID is required.'),
  role: z.string().min(1, 'Role is required.'),
});
export type UserFormValues = z.infer<typeof userFormSchema>;

export const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  ownerId: z.string().min(1, 'Owner ID is required.'),
  industry: z.string().optional(),
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

const keywordSchema = z.object({
  value: z.string().min(1, 'Keyword cannot be empty.'),
});
const regulationSchema = z.object({
  value: z.string().min(1, 'Regulation cannot be empty.'),
});

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z
    .array(regulationSchema)
    .min(1, 'At least one regulation is required.'),
  minSustainabilityScore: z.coerce.number().min(0).max(100).optional(),
  requiredKeywords: z.array(keywordSchema).optional(),
  bannedKeywords: z.array(keywordSchema).optional(),
});
export type CompliancePathFormValues = z.infer<
  typeof compliancePathFormSchema
>;

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
    .min(1, 'You must select at least one scope.'),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const serviceTicketFormSchema = z.object({
  productId: z.string().min(1, 'A product must be selected.'),
  customerName: z.string().min(2, 'Customer name is required.'),
  issue: z
    .string()
    .min(10, 'Issue description must be at least 10 characters.'),
  status: z.enum(['Open', 'In Progress', 'Closed']),
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;

export const productionLineFormSchema = z.object({
  name: z.string().min(3, 'Line name must be at least 3 characters.'),
  location: z.string().min(3, 'Location is required.'),
  status: z.enum(['Active', 'Idle', 'Maintenance']),
  outputPerHour: z.coerce
    .number()
    .int()
    .min(0, 'Output must be a positive number.'),
  currentProduct: z.string().min(1, 'Current product is required.'),
});
export type ProductionLineFormValues = z.infer<
  typeof productionLineFormSchema
>;

// Schema for validating a single product record from a CSV import
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

export const onboardingFormSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters.'),
  industry: z.string().optional(),
});
export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
