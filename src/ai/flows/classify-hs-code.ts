'use server';
/**
 * @fileOverview An AI agent for classifying products with Harmonized System (HS) codes.
 *
 * - classifyHsCode - A function that suggests an HS code for a product.
 * - ClassifyHsCodeInput - The input type for the function.
 * - ClassifyHsCodeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ClassifyHsCodeInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  category: z.string().describe('The general category of the product (e.g., "Electronics", "Fashion").'),
});
export type ClassifyHsCodeInput = z.infer<typeof ClassifyHsCodeInputSchema>;

export const ClassifyHsCodeOutputSchema = z.object({
  code: z.string().regex(/^\d{4}\.\d{2}$/, 'HS Code must be in the format XXXX.XX').describe('The 6-digit Harmonized System (HS) code.'),
  description: z.string().describe('The official description of the HS code category.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the classification (0.0 to 1.0).'),
});
export type ClassifyHsCodeOutput = z.infer<typeof ClassifyHsCodeOutputSchema>;

export async function classifyHsCode(
  input: ClassifyHsCodeInput,
): Promise<ClassifyHsCodeOutput> {
  return classifyHsCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyHsCodePrompt',
  input: { schema: ClassifyHsCodeInputSchema },
  output: { schema: ClassifyHsCodeOutputSchema },
  prompt: `SYSTEM: You are an expert customs classification specialist AI. Your task is to determine the most likely 6-digit Harmonized System (HS) code for a given product based on its name, description, and category.

- Analyze the product details carefully.
- Identify the most appropriate HS code heading (first 4 digits) and subheading (last 2 digits).
- The final code must be in the format XXXX.XX.
- Provide the official, concise description for that 6-digit code.
- Provide a confidence score between 0.0 and 1.0.
- Your output must be a JSON object that strictly adheres to the provided schema.

USER_DATA:
Product Name: {{{productName}}}
Description: {{{productDescription}}}
Category: {{{category}}}
`,
});

const classifyHsCodeFlow = ai.defineFlow(
  {
    name: 'classifyHsCodeFlow',
    inputSchema: ClassifyHsCodeInputSchema,
    outputSchema: ClassifyHsCodeOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
