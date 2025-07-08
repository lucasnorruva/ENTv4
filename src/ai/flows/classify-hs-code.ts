
'use server';
/**
 * @fileOverview An AI agent for classifying products with Harmonized System (HS) codes.
 *
 * - classifyHsCode - A function that suggests an HS code for a product.
 * - ClassifyHsCodeInput - The input type for the function.
 * - ClassifyHsCodeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { ClassifyHsCodeInputSchema, ClassifyHsCodeOutputSchema, type ClassifyHsCodeInput, type HsCodeAnalysis } from '@/types/ai-outputs';

export async function classifyHsCode(
  input: ClassifyHsCodeInput,
): Promise<HsCodeAnalysis> {
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
