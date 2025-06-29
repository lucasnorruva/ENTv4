'use server';

/**
 * @fileOverview An AI agent for summarizing compliance gaps in product data.
 *
 * - summarizeComplianceGaps - A function that analyzes a product against a compliance path.
 * - SummarizeComplianceGapsInput - The input type for the function.
 * - SummarizeComplianceGapsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeComplianceGapsInputSchema = z.object({
  productName: z.string().describe("The product's name."),
  productInformation: z.string().describe('The JSON data associated with the product passport.'),
  compliancePathName: z.string().describe('The name of the compliance path being checked against.'),
  complianceRules: z.string().describe('The JSON representation of the rules for the compliance path.'),
});
export type SummarizeComplianceGapsInput = z.infer<typeof SummarizeComplianceGapsInputSchema>;

const SummarizeComplianceGapsOutputSchema = z.object({
  isCompliant: z.boolean().describe('A boolean indicating if the product is compliant with the rules.'),
  complianceSummary: z.string().describe('A concise, human-readable summary (2-4 sentences) explaining the compliance status, detailing any gaps found or confirming adherence.'),
});
export type SummarizeComplianceGapsOutput = z.infer<typeof SummarizeComplianceGapsOutputSchema>;

export async function summarizeComplianceGaps(input: SummarizeComplianceGapsInput): Promise<SummarizeComplianceGapsOutput> {
  return summarizeComplianceGapsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeComplianceGapsPrompt',
  input: {schema: SummarizeComplianceGapsInputSchema},
  output: {schema: SummarizeComplianceGapsOutputSchema},
  prompt: `You are an expert EU regulatory compliance auditor for Digital Product Passports. Your task is to analyze a product's data against a specific set of compliance rules and provide a clear, concise summary of your findings.

  Analyze the following product information:
  - Product Name: {{{productName}}}
  - Product Passport Data (JSON):
  \`\`\`json
  {{{productInformation}}}
  \`\`\`

  Compare this against the rules defined in the following compliance path:
  - Compliance Path: {{{compliancePathName}}}
  - Compliance Rules (JSON):
  \`\`\`json
  {{{complianceRules}}}
  \`\`\`

  Based on your analysis, determine if the product is compliant. Then, write a 2-4 sentence summary explaining the result. If there are compliance gaps, clearly state what they are (e.g., "The product's sustainability score of 55 is below the required minimum of 60," or "The product contains the banned material 'Lead'."). If it is compliant, confirm that it meets all specified requirements.
  `,
});

const summarizeComplianceGapsFlow = ai.defineFlow(
  {
    name: 'summarizeComplianceGapsFlow',
    inputSchema: SummarizeComplianceGapsInputSchema,
    outputSchema: SummarizeComplianceGapsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
