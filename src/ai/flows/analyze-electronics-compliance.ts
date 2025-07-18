
'use server';
/**
 * @fileOverview An AI agent for analyzing electronics compliance.
 *
 * - analyzeElectronicsCompliance - Analyzes electronics data against standards.
 * - AnalyzeElectronicsComplianceInput - The input type for the function.
 * - AnalyzeElectronicsComplianceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeElectronicsComplianceInputSchema, AnalyzeElectronicsComplianceOutputSchema, type AnalyzeElectronicsComplianceInput, type AnalyzeElectronicsComplianceOutput } from '@/types/ai-outputs';


export async function analyzeElectronicsCompliance(
  input: AnalyzeElectronicsComplianceInput,
): Promise<AnalyzeElectronicsComplianceOutput> {
  return analyzeElectronicsComplianceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeElectronicsCompliancePrompt',
  input: { schema: AnalyzeElectronicsComplianceInputSchema },
  output: { schema: AnalyzeElectronicsComplianceOutputSchema },
  prompt: `SYSTEM: You are an expert in EU electronics compliance, specializing in RoHS, WEEE, and CE marking. Your task is to analyze product data and provide a compliance assessment.

- **RoHS**: Check the 'materials' list for substances like 'Lead', 'Mercury', 'Cadmium'. If found, mark as non-compliant. Also, check the 'compliance.rohs.compliant' field. If it's explicitly false, mark as non-compliant.
- **WEEE**: Check if 'compliance.weee.registered' is true. If not, mark as non-compliant and recommend registration.
- **CE Marking**: Check if 'compliance.ce.marked' is true. If not, mark as non-compliant.
- **Summary**: Provide a concise summary of the findings.

USER_DATA:
{{{json product}}}
`,
});

const analyzeElectronicsComplianceFlow = ai.defineFlow(
  {
    name: 'analyzeElectronicsComplianceFlow',
    inputSchema: AnalyzeElectronicsComplianceInputSchema,
    outputSchema: AnalyzeElectronicsComplianceOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
