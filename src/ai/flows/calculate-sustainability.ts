
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
import { AiProductSchema } from "../schemas";

const CalculateSustainabilityInputSchema = z.object({
  product: AiProductSchema,
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
Product Name: {{{product.productName}}}
Product Description: {{{product.productDescription}}}
Category: {{{product.category}}}

Materials:
{{#each product.materials}}
- Name: {{name}}, Recycled: {{recycledContent}}%, Origin: {{origin}}
{{/each}}

Manufacturing:
- Facility: {{product.manufacturing.facility}}, Country: {{product.manufacturing.country}}

Certifications:
{{#each product.certifications}}
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
