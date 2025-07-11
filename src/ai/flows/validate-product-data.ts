
'use server';

/**
 * @fileOverview An AI agent for validating product data quality and detecting anomalies.
 *
 * - validateProductData - A function that handles the data validation.
 * - ValidateProductDataInput - The input type for the function.
 * - DataQualityWarningSchema - The schema for a single warning.
 * - ValidateProductDataOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { ValidateProductDataInputSchema, ValidateProductDataOutputSchema, type ValidateProductDataInput, type ValidateProductDataOutput } from '@/types/ai-outputs';


export async function validateProductData(
  input: ValidateProductDataInput,
): Promise<ValidateProductDataOutput> {
  return validateProductDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateProductDataPrompt',
  input: { schema: ValidateProductDataInputSchema },
  output: { schema: ValidateProductDataOutputSchema },
  prompt: `SYSTEM: You are a meticulous data quality analyst AI. Your task is to analyze structured product data and identify potential anomalies or errors. Do not be overly strict; only flag clear potential issues.
- Check for inconsistencies between the product category and its materials (e.g., 'Wood' in a 'Smartphone').
- Identify potential typos in material names.
- Check if material percentages add up to roughly 100% if multiple percentages are provided.
- Flag any unusual or implausible values (e.g., negative percentages, unusually high emissions).
- Your output must be a JSON object that strictly adheres to the provided schema. If there are no issues, return an empty 'warnings' array.

USER_DATA:
\`\`\`json
{{{json product}}}
\`\`\`
`,
});

const validateProductDataFlow = ai.defineFlow(
  {
    name: 'validateProductDataFlow',
    inputSchema: ValidateProductDataInputSchema,
    outputSchema: ValidateProductDataOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
