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
});

const manufacturingSchema = z.object({
  facility: z.string().min(1, 'Facility name is required.'),
  country: z.string().min(1, 'Country is required.'),
});

const packagingSchema = z.object({
  type: z.string().min(1, 'Packaging type is required.'),
  recyclable: z.boolean(),
});

const lifecycleSchema = z.object({
  carbonFootprint: z.coerce.number().optional(),
  repairabilityScore: z.coerce.number().min(0).max(10).optional(),
  expectedLifespan: z.coerce.number().min(0).optional(),
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
});

export const productFormSchema = z.object({
  gtin: z.string().optional(),
  productName: z.string().min(3, 'Product name must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  productImage: z.string().optional(),
  category: z.enum(['Electronics', 'Fashion', 'Home Goods']),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  manualUrl: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  manufacturing: manufacturingSchema.optional(),
  certifications: z.array(certificationSchema).optional(),
  packaging: packagingSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  battery: batterySchema.optional(),
  compliance: complianceSchema.optional(),
  customData: z.record(z.any()).optional(),
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
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z.array(z.string()).min(1, 'At least one regulation is required.'),
  minSustainabilityScore: z.coerce.number().min(0).max(100).optional(),
  requiredKeywords: z.array(z.string()).optional(),
  bannedKeywords: z.array(z.string()).optional(),
});
export type CompliancePathFormValues = z.infer<typeof compliancePathFormSchema>;

export const webhookFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  events: z.array(z.string()).min(1, { message: 'You must select at least one event type.'}),
  status: z.enum(['active', 'inactive']),
});
export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

export const apiKeyFormSchema = z.object({
  label: z.string().min(3, 'Label must be at least 3 characters.'),
  scopes: z.array(z.string()).min(1, { message: 'You must select at least one scope.' }),
  expiresAt: z.date().optional(),
  ipRestrictions: z.string().optional(),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const serviceTicketFormSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  customerName: z.string().min(2, "Customer name is required."),
  issue: z.string().min(10, "Issue description must be at least 10 characters."),
  status: z.enum(['Open', 'In Progress', 'Closed']),
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;

export const supportTicketFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required."}),
  email: z.string().email(),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters."}),
  message: z.string().min(20, { message: "Message must be at least 20 characters."}),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const onboardingFormSchema = z.object({
  companyName: z.string().min(2, "Company name is required."),
  industry: z.string().optional(),
});
export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const notificationsFormSchema = z.object({
  productUpdates: z.boolean(),
  complianceAlerts: z.boolean(),
  platformNews: z.boolean(),
});
export type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export const bulkUserImportSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    roles: z.string().transform(val => val.split(',').map(s => s.trim() as Role)),
});
export type BulkUserImportValues = z.infer<typeof bulkUserImportSchema>;
