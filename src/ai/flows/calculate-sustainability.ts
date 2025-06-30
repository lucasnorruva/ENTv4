"use server";

/**
 * @fileOverview An AI agent for calculating a product's ESG score.
 *
 * - calculateSustainability - A function that handles the ESG calculation.
 * - CalculateSustainabilityInput - The input type for the function.
 * - EsgScoreOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const CalculateSustainabilityInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  productDescription: z.string().describe("A description of the product."),
  category: z.string().describe("The product category."),
  currentInformation: z
    .string()
    .describe("The current passport information as a JSON string."),
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
  prompt: `You are an expert in product sustainability and ESG (Environmental, Social, Governance) principles, compliant with EU regulations like ESPR. Your task is to analyze the provided product information and generate an ESG score.

Analyze the product's name, description, category, and JSON data.
- Consider factors like materials (recycled, organic), energy efficiency, repairability, end-of-life options, and certifications (e.g., ISO 14001, Fair Trade).
- If data is insufficient for a pillar, provide a lower score for that pillar and note the lack of data in the summary.
- The summary must be a neutral, factual justification for the scores.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Category: {{{category}}}
Passport Information:
\`\`\`json
{{{currentInformation}}}
\`\`\`
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
