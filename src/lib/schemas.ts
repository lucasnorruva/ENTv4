
import { z } from 'zod';
import { UserRoles } from './constants';

export const productFormSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  productImage: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  // Supplier is now auto-populated from user's company
  supplier: z.string(), // Keep in schema for AI flow, but not in form
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  materials: z.array(
    z.object({
      name: z.string().min(1, 'Material name is required'),
      percentage: z.coerce.number().optional(),
      recycledContent: z.coerce.number().optional(),
      origin: z.string().optional(),
    }),
  ),
  manufacturing: z.object({
    facility: z.string().min(1, 'Facility name is required'),
    country: z.string().min(1, 'Country is required'),
    emissionsKgCo2e: z.coerce.number().optional(),
  }),
  certifications: z.array(
    z.object({
      name: z.string().min(1, 'Certificate name is required'),
      issuer: z.string().min(1, 'Issuer is required'),
      validUntil: z.string().optional(),
    }),
  ),
  packaging: z.object({
    type: z.string().min(1, 'Packaging type is required'),
    recycledContent: z.coerce.number().optional(),
    recyclable: z.boolean(),
  }),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const compliancePathFormSchema = z.object({
  name: z.string().min(5, 'Path name must be at least 5 characters long.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.'),
  category: z.string().min(1, 'Category is required.'),
  regulations: z.string().min(1, 'At least one regulation is required.'),
  minSustainabilityScore: z.coerce.number().optional(),
  requiredKeywords: z.string().optional(),
  bannedKeywords: z.string().optional(),
});

export type CompliancePathFormValues = z.infer<
  typeof compliancePathFormSchema
>;

export const userFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email({ message: 'Invalid email address.' }),
  companyId: z.string().min(1, 'Company ID is required.'),
  role: z.enum(Object.values(UserRoles) as [string, ...string[]]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const apiSettingsSchema = z.object({
  isPublicApiEnabled: z.boolean(),
  rateLimitPerMinute: z.coerce
    .number()
    .min(0, 'Rate limit must be non-negative.'),
  isWebhookSigningEnabled: z.boolean(),
});

export type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;
