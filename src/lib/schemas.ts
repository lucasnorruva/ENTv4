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
  documentUrl: z.string().url().optional().or(z.literal('')),
});

const manufacturingSchema = z.object({
  facility: z.string().min(1, 'Facility name is required.'),
  country: z.string().min(1, 'Country is required.'),
  emissionsKgCo2e: z.coerce.number().optional(),
});

const packagingSchema = z.object({
  type: z.string().min(1, 'Packaging type is required.'),
  recycledContent: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  recyclable: z.boolean(),
});

const lifecycleSchema = z.object({
  carbonFootprint: z.coerce.number().optional(),
  carbonFootprintMethod: z.string().optional(),
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
});

const textileDataSchema = z.object({
  fiberComposition: z.array(z.object({
    name: z.string().min(1, 'Fiber name is required.'),
    percentage: z.coerce.number().min(0).max(100),
  })).optional(),
  dyeProcess: z.string().optional(),
  weaveType: z.string().optional(),
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
  category: z.enum(['Electronics', 'Fashion', 'Home Goods', 'Construction']),
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
  compliance: complianceSchema.optional(),
  customData: z.record(z.any()).optional(),
  textile: textileDataSchema.optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const custodyStepSchema = z.object({
  event: z.string().min(3, "Event description is required."),
  location: z.string().min(2, "Location is required."),
  actor: z.string().min(2, "Actor name is required."),
});
export type CustodyStepFormValues = z.infer<typeof custodyStepSchema>;

export const ownershipTransferSchema = z.object({
  newOwnerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address."),
});
export type OwnershipTransferFormValues = z.infer<typeof ownershipTransferSchema>;

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
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const companySettingsSchema = z.object({
  aiEnabled: z.boolean(),
  apiAccess: z.boolean(),
  brandingCustomization: z.boolean(),
  theme: z.object({
    light: z.object({
      primary: z.string().optional(),
      accent: z.string().optional(),
    }),
    dark: z.object({
      primary: z.string().optional(),
      accent: z.string().optional(),
    }),
  }).optional(),
  customFields: z.array(z.object({
    id: z.string().min(1, "ID is required."),
    label: z.string().min(1, "Label is required."),
    type: z.enum(['text', 'number', 'boolean']),
  })).optional(),
});
export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z
    .array(z.object({ value: z.string().min(1, 'Regulation cannot be empty.') }))
    .min(1, 'At least one regulation is required.'),
  minSustainabilityScore: z.coerce.number().min(0).max(100).optional(),
  requiredKeywords: z.array(z.object({ value: z.string() })).optional(),
  bannedKeywords: z.array(z.object({ value: z.string() })).optional(),
});
export type CompliancePathFormValues = z.infer<
  typeof compliancePathFormSchema
>;

export const webhookFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  events: z.array(z.string()).min(1, { message: "You must select at least one event type." }),
  status: z.enum(['active', 'inactive']),
});
export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

export const apiKeyFormSchema = z.object({
  label: z.string().min(3, 'Label must be at least 3 characters.'),
  scopes: z.array(z.string()).min(1, { message: 'You must select at least one scope.' }),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const serviceTicketFormSchema = z.object({
  productId: z.string().optional(),
  productionLineId: z.string().optional(),
  customerName: z.string().min(2, "Customer name is required."),
  issue: z.string().min(10, "Issue description must be at least 10 characters."),
  status: z.enum(['Open', 'In Progress', 'Closed']),
  imageUrl: z.string().url().optional().or(z.literal('')),
}).refine(data => data.productId || data.productionLineId, {
    message: "Either a product or a production line must be selected.",
    path: ["productId"], // you can attach the error to a specific field
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;

export const bulkUserImportSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  roles: z.string().transform((val) => val.split(',').map(s => s.trim() as Role)),
});
export type BulkUserImportValues = z.infer<typeof bulkUserImportSchema>;

export const supportTicketFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email(),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
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

export const bulkProductImportSchema = z.object({
    productName: z.string().min(3),
    productDescription: z.string().min(10),
    gtin: z.string().optional(),
    category: z.enum(['Electronics', 'Fashion', 'Home Goods']),
    productImage: z.string().url().optional(),
    manualUrl: z.string().url().optional(),
    materials: z.string().transform((val) => (val ? JSON.parse(val) : [])),
  });
export type BulkProductImportValues = z.infer<typeof bulkProductImportSchema>;

export const customsInspectionFormSchema = z.object({
    status: z.enum(['Cleared', 'Detained', 'Rejected']),
    authority: z.string().min(2, 'Authority is required.'),
    location: z.string().min(2, 'Location is required.'),
    notes: z.string().optional(),
});
export type CustomsInspectionFormValues = z.infer<typeof customsInspectionFormSchema>;

export const overrideVerificationSchema = z.object({
  reason: z.string().min(10, 'A justification is required (min. 10 characters).'),
});
export type OverrideVerificationFormValues = z.infer<typeof overrideVerificationSchema>;

export const deleteAccountSchema = z.object({
    confirmText: z.string().refine(val => val === "DELETE MY ACCOUNT", {
      message: "You must type 'DELETE MY ACCOUNT' to confirm.",
    }),
});
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
