// src/ai/schemas.ts
import { z } from 'zod';

/**
 * A shared Zod schema for the product data passed to AI flows.
 * This ensures consistency and reusability across different AI agents.
 * It's a subset of the main Product type, containing only the fields
 * necessary for AI analysis.
 */
export const AiProductSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A description of the product.'),
  category: z.string().describe('The product category.'),
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
      emissionsKgCo2e: z.number().optional(),
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
      recycledContent: z.number().optional(),
      weight: z.number().optional(),
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
      type: z.string(),
      capacityMah: z.number().optional(),
      voltage: z.number().optional(),
      isRemovable: z.boolean(),
    })
    .describe('Battery specifications.')
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
});

export type AiProduct = z.infer<typeof AiProductSchema>;
