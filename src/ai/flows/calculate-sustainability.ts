"use server";

/**
 * @fileOverview An AI agent for calculating a product's sustainability score.
 *
 * - calculateSustainability - A function that handles the sustainability calculation.
 * - CalculateSustainabilityInput - The input type for the function.
 * - CalculateSustainabilityOutput - The return type for the function.
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

const CalculateSustainabilityOutputSchema = z.object({
  sustainabilityScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "A sustainability score from 0 to 100, where 100 is most sustainable.",
    ),
  sustainabilityReport: z
    .string()
    .describe(
      "A brief report (2-3 sentences) explaining the rationale for the given score.",
    ),
});
export type CalculateSustainabilityOutput = z.infer<
  typeof CalculateSustainabilityOutputSchema
>;

export async function calculateSustainability(
  input: CalculateSustainabilityInput,
): Promise<CalculateSustainabilityOutput> {
  return calculateSustainabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: "calculateSustainabilityPrompt",
  input: { schema: CalculateSustainabilityInputSchema },
  output: { schema: CalculateSustainabilityOutputSchema },
  prompt: `You are an expert in product sustainability and circular economy principles, compliant with EU regulations like ESPR. Your task is to analyze the provided product information and generate a sustainability score and a brief report.

  Analyze the product's name, description, category, and especially the detailed JSON data in its passport.
  Consider factors like materials used (recycled, organic, virgin), energy efficiency, repairability, end-of-life options, and certifications.
  Based on your analysis, provide a score from 0 (not sustainable at all) to 100 (perfectly sustainable and circular).
  Also, provide a concise report (2-3 sentences) justifying the score, highlighting both positive and negative aspects.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Category: {{{category}}}
  Passport Information:
  \`\`\`json
  {{{currentInformation}}}
  \`\`\`
  `,
});

const calculateSustainabilityFlow = ai.defineFlow(
  {
    name: "calculateSustainabilityFlow",
    inputSchema: CalculateSustainabilityInputSchema,
    outputSchema: CalculateSustainabilityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
