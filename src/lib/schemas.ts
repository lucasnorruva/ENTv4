// src/lib/schemas.ts
import { z } from 'zod';

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
});

export const productFormSchema = z.object({
  productName: z.string().min(3, 'Product name must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  productImage: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
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
});
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(3, 'Path name is required.'),
  description: z.string().min(10, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z.string().min(1, 'At least one regulation is required.'),
  minSustainabilityScore: z.coerce.number().min(0).max(100).optional(),
  requiredKeywords: z.string().optional(),
  bannedKeywords: z.string().optional(),
});
export type CompliancePathFormValues = z.infer<
  typeof compliancePathFormSchema
>;

export const apiSettingsSchema = z.object({
  isPublicApiEnabled: z.boolean(),
  rateLimitPerMinute: z.coerce.number().int().min(0),
  isWebhookSigningEnabled: z.boolean(),
});
export type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export const serviceTicketFormSchema = z.object({
  productId: z.string().min(1, 'A product must be selected.'),
  customerName: z.string().min(2, 'Customer name is required.'),
  issue: z.string().min(10, 'Issue description must be at least 10 characters.'),
  status: z.enum(['Open', 'In Progress', 'Closed']),
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketFormSchema>;
