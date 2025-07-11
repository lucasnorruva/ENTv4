// src/ai/schemas.ts
import { z } from 'zod';

/**
 * A shared Zod schema for textile-specific data.
 */
export const textileDataSchema = z.object({
  fiberComposition: z.array(z.object({
    name: z.string().min(1, 'Fiber name is required.'),
    percentage: z.coerce.number().min(0).max(100),
  })).optional(),
  dyeProcess: z.string().optional(),
  weaveType: z.string().optional(),
});


/**
 * A shared Zod schema for the product data passed to AI flows.
 * This ensures consistency and reusability across different AI agents.
 * It's a subset of the main Product type, containing only the fields
 * necessary for AI analysis.
 */
export const AiProductSchema = z.object({
  gtin: z.string().optional().describe('The Global Trade Item Number (GTIN) of the product.'),
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A description of the product.'),
  category: z.enum(['Electronics', 'Fashion', 'Home Goods']),
  supplier: z.string().describe('The name of the product supplier or brand.'),
  materials: z
    .array(
      z.object({
        name: z.string(),
        percentage: z.number().optional(),
        recycledContent: z.number().optional(),
        origin: z.string().optional(),
      }),
    )
    .describe('List of materials in the product.'),
  manufacturing: z
    .object({
      facility: z.string(),
      country: z.string(),
    })
    .describe('Manufacturing details.')
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        validUntil: z.string().optional(),
      }),
    )
    .describe('List of certifications.')
    .optional(),
  packaging: z
    .object({
      type: z.string(),
      recyclable: z.boolean(),
    })
    .describe('Packaging details.')
    .optional(),
  lifecycle: z
    .object({
      carbonFootprint: z.number().optional(),
      carbonFootprintMethod: z.string().optional(),
      repairabilityScore: z.number().optional(),
      expectedLifespan: z.number().optional(),
    })
    .describe('Lifecycle and durability metrics.')
    .optional(),
  battery: z
    .object({
      type: z.string().optional(),
      capacityMah: z.number().optional(),
      voltage: z.number().optional(),
      isRemovable: z.boolean().optional(),
    })
    .describe('Battery specifications.')
    .optional(),
  compliance: z
    .object({
      rohs: z.object({ compliant: z.boolean().optional() }).optional(),
      reach: z.object({ svhcDeclared: z.boolean().optional() }).optional(),
      weee: z.object({ registered: z.boolean().optional() }).optional(),
      eudr: z.object({ compliant: z.boolean().optional() }).optional(),
      ce: z.object({ marked: z.boolean().optional() }).optional(),
      prop65: z.object({ warningRequired: z.boolean().optional() }).optional(),
    })
    .describe('Specific compliance declarations.')
    .optional(),
  verificationStatus: z
    .string()
    .optional()
    .describe(
      "The product's verification status (e.g., 'Verified', 'Pending', 'Failed').",
    ),
  complianceSummary: z
    .string()
    .optional()
    .describe("A summary of the product's compliance status."),
  textile: textileDataSchema.optional().describe('Textile-specific data.'),
});

export type AiProduct = z.infer<typeof AiProductSchema>;
