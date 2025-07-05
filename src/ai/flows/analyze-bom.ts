
'use server';
/**
 * @fileOverview An AI agent for parsing unstructured Bill of Materials (BOM) text.
 *
 * - analyzeBillOfMaterials - A function that parses BOM text into structured data.
 * - AnalyzeBomInput - The input type for the function.
 * - AnalyzeBomOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeBomInputSchema = z.object({
  bomText: z.string().describe('The unstructured Bill of Materials text.'),
});
export type AnalyzeBomInput = z.infer<typeof AnalyzeBomInputSchema>;

const AnalyzedMaterialSchema = z.object({
  name: z.string().describe('The identified name of the material or component.'),
  percentage: z
    .number()
    .optional()
    .describe(
      'The percentage of this material in the product, if specified.',
    ),
  origin: z.string().optional().describe('The origin country, if specified.'),
});

const AnalyzeBomOutputSchema = z.object({
  materials: z
    .array(AnalyzedMaterialSchema)
    .describe(
      'A structured list of materials extracted from the BOM text.',
    ),
});
export type AnalyzeBomOutput = z.infer<typeof AnalyzeBomOutputSchema>;

export async function analyzeBillOfMaterials(
  input: AnalyzeBomInput,
): Promise<AnalyzeBomOutput> {
  return analyzeBomFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBomPrompt',
  input: { schema: AnalyzeBomInputSchema },
  output: { schema: AnalyzeBomOutputSchema },
  prompt: `SYSTEM: You are an expert supply chain data analyst AI. Your task is to parse unstructured Bill of Materials (BOM) text and extract a structured list of materials.
- The input can be in any format (CSV, bullet points, JSON fragments, etc.).
- Identify each material/component name, its percentage (if available), and its origin (if available).
- Ignore quantities, part numbers, or other non-material information.
- Standardize material names (e.g., 'Aluminium' to 'Aluminum').
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
{{{bomText}}}
"""
`,
});

const analyzeBomFlow = ai.defineFlow(
  {
    name: 'analyzeBomFlow',
    inputSchema: AnalyzeBomInputSchema,
    outputSchema: AnalyzeBomOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
