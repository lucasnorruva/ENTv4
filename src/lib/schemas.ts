import { z } from 'zod';

export const productFormSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['Published', 'Draft', 'Archived']),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
