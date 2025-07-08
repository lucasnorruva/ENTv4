
'use server';
/**
 * @fileOverview An AI agent for generating compliance rules.
 *
 * - generateComplianceRules - Generates rules for a compliance path.
 * - GenerateComplianceRulesInput - The input type for the function.
 * - GenerateComplianceRulesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { GenerateComplianceRulesInputSchema, GenerateComplianceRulesOutputSchema, type GenerateComplianceRulesInput, type GenerateComplianceRulesOutput } from '@/types/ai-outputs';


export async function generateComplianceRules(
  input: GenerateComplianceRulesInput,
): Promise<GenerateComplianceRulesOutput> {
  return generateComplianceRulesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComplianceRulesPrompt',
  input: { schema: GenerateComplianceRulesInputSchema },
  output: { schema: GenerateComplianceRulesOutputSchema },
  prompt: `SYSTEM: You are a world-class EU and global compliance expert AI. Your task is to generate a structured set of rules for a digital product passport compliance path based on its name and associated regulations.

- Analyze the provided compliance path name and the list of regulations.
- Suggest a reasonable 'minSustainabilityScore' (0-100) that reflects the strictness of the regulations.
- Based on the regulations (e.g., RoHS, REACH, GOTS), determine a list of 'bannedKeywords' (e.g., restricted substances like 'Lead', 'Mercury').
- If applicable, determine a list of 'requiredKeywords' (e.g., 'Organic Cotton' for GOTS).
- If no specific keywords apply, return empty arrays.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text outside the JSON structure.

USER_DATA:
"""
Path Name: {{{name}}}
Regulations:
{{#each regulations}}
- {{this}}
{{/each}}
"""
`,
});

const generateComplianceRulesFlow = ai.defineFlow(
  {
    name: 'generateComplianceRulesFlow',
    inputSchema: GenerateComplianceRulesInputSchema,
    outputSchema: GenerateComplianceRulesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
