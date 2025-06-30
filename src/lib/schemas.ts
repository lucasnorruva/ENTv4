
import { z } from 'zod';

export const productFormSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  productImage: z.any(),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
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
