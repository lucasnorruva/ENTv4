
"use server";

/**
 * @fileOverview An AI agent for classifying a product's ESG category and risk.
 *
 * - classifyProduct - A function that handles the product classification.
 * - ClassifyProductInput - The input type for the function.
 * - ClassifyProductOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { ClassifyProductInputSchema, ClassifyProductOutputSchema, type ClassifyProductInput, type ClassifyProductOutput } from "@/types/ai-outputs";

export async function classifyProduct(
  input: ClassifyProductInput,
): Promise<ClassifyProductOutput> {
  return classifyProductFlow(input);
}

const prompt = ai.definePrompt({
  name: "classifyProductPrompt",
  input: { schema: ClassifyProductInputSchema },
  output: { schema: ClassifyProductOutputSchema },
  prompt: `SYSTEM: You are an ESG analyst AI specializing in product lifecycle assessment. Your task is to classify a product and assess its risk based on provided data, with alignment to ISO 14067.
- Analyze the product's name, description, and category.
- Determine a relevant 'esgCategory' (e.g., 'Circular Design', 'Resource Depletion', 'Pollution Prevention').
- Provide a 'riskScore' from 0 (low risk) to 10 (high risk), informed by ISO 14067 principles.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{product.productName}}}
Product Description: {{{product.productDescription}}}
Category: {{{product.category}}}
"""
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
