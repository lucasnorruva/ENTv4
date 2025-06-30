// src/lib/schemas.ts
import { z } from 'zod';

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required.'),
  percentage: z.number().optional(),
  recycledContent: z.number().optional(),
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
  emissionsKgCo2e: z.number().optional(),
});

const packagingSchema = z.object({
  type: z.string().min(1, 'Packaging type is required.'),
  recyclable: z.boolean(),
});

export const productFormSchema = z.object({
  productName: z.string().min(3, 'Product name must be at least 3 characters.'),
  productDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  category: z.string().min(1, 'Category is required.'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  materials: z.array(materialSchema).optional(),
  manufacturing: manufacturingSchema.optional(),
  certifications: z.array(certificationSchema).optional(),
  packaging: packagingSchema.optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
