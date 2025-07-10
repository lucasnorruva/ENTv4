// src/ai/flows/analyze-food-safety.ts
'use server';
/**
 * @fileOverview An AI agent for analyzing food products for safety.
 *
 * - analyzeFoodSafety - Analyzes ingredients for allergens and materials for food contact safety.
 * - AnalyzeFoodSafetyInput - The input type for the function.
 * - AnalyzeFoodSafetyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AnalyzeFoodSafetyInputSchema = z.object({
  productName: z.string().describe('The name of the food product.'),
  ingredients: z.array(z.string()).describe('The list of ingredients.'),
  packagingMaterials: z
    .array(z.string())
    .describe(
      'The list of packaging materials that come into contact with the food.',
    ),
});
export type AnalyzeFoodSafetyInput = z.infer<
  typeof AnalyzeFoodSafetyInputSchema
>;
export const AnalyzeFoodSafetyOutputSchema = z.object({
  riskLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The overall food safety risk assessment.'),
  potentialAllergens: z
    .array(z.string())
    .describe('A list of potential allergens identified from the ingredients.'),
  complianceNotes: z
    .array(z.string())
    .describe(
      'A list of notes regarding food contact material compliance (e.g., "Check for BPA in polycarbonate packaging", "Verify compliance with EU 10/2011 for plastics").',
    ),
});
export type AnalyzeFoodSafetyOutput = z.infer<
  typeof AnalyzeFoodSafetyOutputSchema
>;

export async function analyzeFoodSafety(
  input: AnalyzeFoodSafetyInput,
): Promise<AnalyzeFoodSafetyOutput> {
  return analyzeFoodSafetyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodSafetyPrompt',
  input: { schema: AnalyzeFoodSafetyInputSchema },
  output: { schema: AnalyzeFoodSafetyOutputSchema },
  prompt: `SYSTEM: You are a food safety and regulatory compliance expert. Your task is to analyze a food product's ingredients and packaging materials for potential risks.

- **Allergen Identification**: From the 'ingredients' list, identify common major allergens (e.g., Milk, Eggs, Fish, Crustacean shellfish, Tree nuts, Peanuts, Wheat, Soybeans, Sesame). List them in 'potentialAllergens'.
- **Packaging Material Analysis**: From the 'packagingMaterials' list, identify any materials that have specific regulations for food contact (e.g., plastics, BPA, phthalates). Provide actionable notes in 'complianceNotes', referencing standards like EU 10/2011 or FDA regulations where appropriate.
- **Risk Assessment**: Based on the presence of allergens and high-risk packaging materials, determine an overall 'riskLevel'.

USER_DATA:
Product: {{{productName}}}
Ingredients:
{{#each ingredients}}
- {{this}}
{{/each}}

Packaging Materials:
{{#each packagingMaterials}}
- {{this}}
{{/each}}
`,
});

const analyzeFoodSafetyFlow = ai.defineFlow(
  {
    name: 'analyzeFoodSafetyFlow',
    inputSchema: AnalyzeFoodSafetyInputSchema,
    outputSchema: AnalyzeFoodSafetyOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);