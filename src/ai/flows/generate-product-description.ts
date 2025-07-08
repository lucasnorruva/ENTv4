
'use server';
/**
 * @fileOverview An AI agent for generating product descriptions.
 *
 * - generateProductDescription - A function that generates a description.
 * - GenerateProductDescriptionInput - The input type for the function.
 * - GenerateProductDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { GenerateProductDescriptionInputSchema, GenerateProductDescriptionOutputSchema, type GenerateProductDescriptionInput, type GenerateProductDescriptionOutput } from '@/types/ai-outputs';


export async function generateProductDescription(
  input: GenerateProductDescriptionInput,
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `SYSTEM: You are a professional e-commerce copywriter. Your task is to write a compelling, concise, and professional product description based on the provided details.
- The description should be 2 to 4 sentences long.
- Highlight the key materials in a natural way.
- Maintain a positive and trustworthy tone.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{productName}}}
Category: {{{category}}}
Key Materials:
{{#each materials}}
- {{name}}
{{/each}}
"""
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
