
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
  documentUrl: z.string().url().or(z.literal('')).optional(),
});

const manufacturingSchema = z.object({
  facility: z.string().min(1, 'Facility name is required.'),
  country: z.string().min(1, 'Country is required.'),
  manufacturingProcess: z.string().optional(),
});

const packagingSchema = z.object({
  type: z.string().min(1, 'Packaging type is required.'),
  recycledContent: z.coerce.number().optional(),
  recyclable: z.boolean(),
  weight: z.coerce.number().optional(),
});

const lifecycleSchema = z.object({
  carbonFootprint: z.coerce.number().optional(),
  carbonFootprintMethod: z.string().optional(),
  scopeEmissions: z
    .object({
      scope1: z.coerce.number().optional(),
      scope2: z.coerce.number().optional(),
      scope3: z.coerce.number().optional(),
    })
    .optional(),
  repairabilityScore: z.coerce.number().min(0).max(10).optional(),
  expectedLifespan: z.coerce.number().min(0).optional(),
  recyclingInstructions: z.string().optional(),
  energyEfficiencyClass: z.string().optional(),
});

const batterySchema = z.object({
  type: z.string().optional(),
  capacityMah: z.coerce.number().optional(),
  voltage: z.coerce.number().optional(),
  isRemovable: z.boolean().optional(),
});

const textileSchema = z.object({
  fiberComposition: z
    .array(
      z.object({
        name: z.string().min(1, 'Fiber name is required.'),
        percentage: z.coerce.number().min(0).max(100),
      }),
    )
    .optional(),
  dyeProcess: z.string().optional(),
  weaveType: z.string().optional(),
});

const foodSafetySchema = z.object({
  ingredients: z.array(z.object({ value: z.string().min(1) })).optional(),
  allergens: z.string().optional(),
});

const massBalanceSchema = z.object({
  creditsAllocated: z.coerce.number().optional(),
  certificationBody: z.enum(['ISCC PLUS', 'REDcert-EU', 'Other']).optional(),
  certificateNumber: z.string().optional(),
});

const greenClaimSchema = z.object({
  claim: z.string().min(1, 'Claim is required.'),
  substantiation: z.string().min(1, 'Substantiation is required.'),
});

const nfcSchema = z.object({
  uid: z.string().optional(),
  technology: z.string().optional(),
  writeProtected: z.boolean().optional(),
});

export const productFormSchema = z.object({
  gtin: z.string().optional(),
  productName: z.string().min(3, 'Product name must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  productImage: z.string().optional(),
  category: z.enum([
    'Electronics',
    'Fashion',
    'Home Goods',
    'Construction',
    'Food & Beverage',
  ]),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  manualUrl: z.string().optional(),
  manualFileName: z.string().optional(),
  manualFileSize: z.number().optional(),
  manualFileHash: z.string().optional(),
  model3dUrl: z.string().optional(),
  model3dFileName: z.string().optional(),
  model3dFileHash: z.string().optional(),
  declarationOfConformity: z.string().optional(),
  sustainabilityDeclaration: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  manufacturing: manufacturingSchema.optional(),
  certifications: z.array(certificationSchema).optional(),
  packaging: packagingSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  battery: batterySchema.optional(),
  compliance: z.object({}).passthrough().optional(), // Allow any compliance fields
  customData: z.record(z.any()).optional(),
  textile: textileSchema.optional(),
  foodSafety: foodSafetySchema.optional(),
  massBalance: massBalanceSchema.optional(),
  greenClaims: z.array(greenClaimSchema).optional(),
  nfc: nfcSchema.optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const userFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  companyId: z.string().min(1, 'Company ID is required.'),
  roles: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one role.',
  }),
});
export type UserFormValues = z.infer<typeof userFormSchema>;

export const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  ownerId: z.string().min(1, 'Owner ID is required.'),
  industry: z.string().optional(),
  tier: z.enum(['free', 'pro', 'enterprise']).optional(),
  isTrustedIssuer: z.boolean().optional(),
  revocationListUrl: z.string().url().or(z.literal('')).optional(),
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  jurisdiction: z.string().min(1, 'Jurisdiction is required.'),
  regulations: z.array(z.object({ value: z.string().min(1) })),
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
  expiresAt: z.date().optional(),
  ipRestrictions: z.string().optional(),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const productionLineFormSchema = z.object({
  name: z.string().min(2, 'Line name must be at least 2 characters.'),
  location: z.string().min(2, 'Location is required.'),
  status: z.enum(['Active', 'Idle', 'Maintenance']),
  outputPerHour: z.coerce.number().min(0, 'Output must be a positive number.'),
  productId: z.string().optional(),
});
export type ProductionLineFormValues = z.infer<
  typeof productionLineFormSchema
>;

export const serviceTicketFormSchema = z
  .object({
    productId: z.string().optional(),
    productionLineId: z.string().optional(),
    customerName: z.string().min(2, 'Customer name is required.'),
    issue: z
      .string()
      .min(10, 'Issue description must be at least 10 characters.'),
    status: z.enum(['Open', 'In Progress', 'Closed']),
    imageUrl: z.string().optional(),
  })
  .refine(data => data.productId || data.productionLineId, {
    message: 'Either a Product or Production Line must be selected.',
    path: ['productId'], // You can associate the error with one of the fields
  });
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;

export const supportTicketFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  email: z.string().email(),
  subject: z
    .string()
    .min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z
    .string()
    .min(20, { message: 'Message must be at least 20 characters.' }),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const onboardingFormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  industry: z.string().optional(),
});
export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters.' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const notificationsFormSchema = z.object({
  productUpdates: z.boolean(),
  complianceAlerts: z.boolean(),
  platformNews: z.boolean(),
});
export type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export const deleteAccountSchema = z.object({
  confirmText: z
    .string()
    .refine(val => val === 'DELETE MY ACCOUNT', {
      message: "You must type 'DELETE MY ACCOUNT' to confirm.",
    }),
});
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;

export const overrideVerificationSchema = z.object({
  reason: z
    .string()
    .min(10, 'A justification is required (min 10 characters).'),
});
export type OverrideVerificationFormValues = z.infer<
  typeof overrideVerificationSchema
>;

export const customsInspectionFormSchema = z.object({
  status: z.enum(['Cleared', 'Detained', 'Rejected']),
  authority: z.string().min(2, 'Authority name is required.'),
  location: z.string().min(2, 'Location is required.'),
  notes: z.string().optional(),
});
export type CustomsInspectionFormValues = z.infer<
  typeof customsInspectionFormSchema
>;

export const apiSettingsSchema = z.object({
    isPublicApiEnabled: z.boolean(),
    rateLimits: z.object({
      free: z.number().int().min(0),
      pro: z.number().int().min(0),
      enterprise: z.number().int().min(0),
    }),
    isWebhookSigningEnabled: z.boolean(),
  });
export type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export const companySettingsSchema = z.object({
  aiEnabled: z.boolean(),
  apiAccess: z.boolean(),
  brandingCustomization: z.boolean(),
  logoUrl: z.string().optional(),
  logoFileName: z.string().optional(),
  theme: z
    .object({
      light: z.object({
        primary: z.string().optional(),
        accent: z.string().optional(),
      }),
      dark: z.object({
        primary: z.string().optional(),
        accent: z.string().optional(),
      }),
    })
    .optional(),
  customFields: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['text', 'number', 'boolean']),
      }),
    )
    .optional(),
});
export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export const bulkProductImportSchema = z.object({
  productName: z.string().min(3),
  productDescription: z.string().min(10),
  gtin: z.string().optional(),
  category: z.enum([
    'Electronics',
    'Fashion',
    'Home Goods',
    'Construction',
    'Food & Beverage',
  ]),
  productImage: z.string().url().optional(),
  manualUrl: z.string().url().optional(),
  materials: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        const result = z
          .array(
            z.object({ name: z.string(), percentage: z.number().optional() }),
          )
          .safeParse(parsed);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format for materials.',
          });
          return z.NEVER;
        }
        return result.data;
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

export const custodyStepSchema = z.object({
  event: z.string().min(2, "Event description is required."),
  location: z.string().min(2, "Location is required."),
  actor: z.string().min(2, "Actor/Responsible party is required."),
});
export type CustodyStepFormValues = z.infer<typeof custodyStepSchema>;

export const ownershipTransferSchema = z.object({
  newOwnerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address."),
});
export type OwnershipTransferFormValues = z.infer<typeof ownershipTransferSchema>;

export const bulkUserImportSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  roles: z.string().transform((val, ctx) => {
    const roles = val.split(',').map(r => r.trim());
    const validRoles = Object.values(UserRoles);
    const invalidRoles = roles.filter(r => !validRoles.includes(r as Role));
    if (invalidRoles.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid role(s): ${invalidRoles.join(', ')}`,
      });
      return z.NEVER;
    }
    return roles as Role[];
  }),
});
export type BulkUserImportValues = z.infer<typeof bulkUserImportSchema>;
