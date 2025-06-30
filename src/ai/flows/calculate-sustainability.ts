
"use server";

/**
 * @fileOverview An AI agent for calculating a product's ESG score.
 *
 * - calculateSustainability - A function that handles the ESG calculation.
 * - CalculateSustainabilityInputSchema - The input type for the function.
 * - EsgScoreOutputSchema - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

const MaterialSchema = z.object({
  name: z.string(),
  percentage: z.number().optional(),
  recycledContent: z.number().optional(),
  origin: z.string().optional(),
});

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  validUntil: z.string().optional(),
});

const ManufacturingSchema = z.object({
  facility: z.string(),
  country: z.string(),
  emissionsKgCo2e: z.number().optional(),
});

const CalculateSustainabilityInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  productDescription: z.string().describe("A description of the product."),
  category: z.string().describe("The product category."),
  materials: z
    .array(MaterialSchema)
    .describe("List of materials in the product."),
  manufacturing: ManufacturingSchema.describe("Manufacturing details."),
  certifications: z
    .array(CertificationSchema)
    .describe("List of certifications."),
});
export type CalculateSustainabilityInput = z.infer<
  typeof CalculateSustainabilityInputSchema
>;

const EsgScoreOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "An overall ESG score from 0 to 100, where 100 is most sustainable.",
    ),
  environmental: z
    .number()
    .min(0)
    .max(10)
    .describe("The environmental score from 0-10."),
  social: z.number().min(0).max(10).describe("The social score from 0-10."),
  governance: z
    .number()
    .min(0)
    .max(10)
    .describe("The governance score from 0-10."),
  summary: z
    .string()
    .describe(
      "A brief report (2-3 sentences) explaining the rationale for the given score.",
    ),
});
export type EsgScoreOutput = z.infer<typeof EsgScoreOutputSchema>;

export async function calculateSustainability(
  input: CalculateSustainabilityInput,
): Promise<EsgScoreOutput> {
  return calculateEsgScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: "calculateEsgScorePrompt",
  input: { schema: CalculateSustainabilityInputSchema },
  output: { schema: EsgScoreOutputSchema },
  prompt: `SYSTEM: You are an expert in product sustainability and ESG (Environmental, Social, Governance) principles, compliant with EU regulations like ESPR. Your task is to analyze the provided structured product information and generate an ESG score.
- Analyze the product's name, description, category, and all structured data.
- Consider factors like materials (recycled content, origin), energy efficiency, repairability, end-of-life options, manufacturing details (country, emissions), and certifications (e.g., ISO 14001, Fair Trade).
- If data is insufficient for a pillar (e.g. no social certifications), provide a lower score for that pillar and note the lack of data in the summary.
- The summary must be a neutral, factual justification for the scores.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Category: {{{category}}}

Materials:
{{#each materials}}
- Name: {{name}}, Recycled: {{recycledContent}}%, Origin: {{origin}}
{{/each}}

Manufacturing:
- Facility: {{manufacturing.facility}}, Country: {{manufacturing.country}}

Certifications:
{{#each certifications}}
- Name: {{name}}, Issuer: {{issuer}}
{{/each}}
"""
`,
});

const calculateEsgScoreFlow = ai.defineFlow(
  {
    name: "calculateEsgScoreFlow",
    inputSchema: CalculateSustainabilityInputSchema,
    outputSchema: EsgScoreOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
