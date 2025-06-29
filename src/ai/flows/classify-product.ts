"use server";

/**
 * @fileOverview An AI agent for classifying a product's ESG category and risk.
 *
 * - classifyProduct - A function that handles the product classification.
 * - ClassifyProductInput - The input type for the function.
 * - ClassifyProductOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ClassifyProductInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  productDescription: z.string().describe("A description of the product."),
  category: z.string().describe("The product category."),
  currentInformation: z
    .string()
    .describe("The current passport information as a JSON string."),
});
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;

const ClassifyProductOutputSchema = z.object({
  esgCategory: z
    .string()
    .describe(
      "The determined ESG category for the product (e.g., Circular Design, Resource Depletion, Pollution Prevention).",
    ),
  riskScore: z
    .number()
    .min(0)
    .max(10)
    .describe(
      "An ESG risk score from 0 (low risk) to 10 (high risk), aligned with ISO 14067 principles.",
    ),
});
export type ClassifyProductOutput = z.infer<typeof ClassifyProductOutputSchema>;

export async function classifyProduct(
  input: ClassifyProductInput,
): Promise<ClassifyProductOutput> {
  return classifyProductFlow(input);
}

const prompt = ai.definePrompt({
  name: "classifyProductPrompt",
  input: { schema: ClassifyProductInputSchema },
  output: { schema: ClassifyProductOutputSchema },
  prompt: `You are an ESG analyst. Based on the product information, classify it into an ESG category and provide a risk score.
  Your analysis should be informed by principles similar to those in ISO 14067 for carbon footprint, but applied more broadly to ESG risks.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Category: {{{category}}}
  Passport Information:
  \`\`\`json
  {{{currentInformation}}}
  \`\`\`
  `,
});

const classifyProductFlow = ai.defineFlow(
  {
    name: "classifyProductFlow",
    inputSchema: ClassifyProductInputSchema,
    outputSchema: ClassifyProductOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
