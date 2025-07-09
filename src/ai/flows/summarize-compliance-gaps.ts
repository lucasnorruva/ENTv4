
"use server";

/**
 * @fileOverview An AI agent for summarizing compliance gaps in product data.
 * This flow first uses deterministic logic to find compliance gaps, then uses
 * an LLM to generate a human-readable summary of those gaps.
 *
 * - summarizeComplianceGaps - A function that analyzes a product against a compliance path.
 * - SummarizeComplianceGapsInput - The input type for the function.
 * - SummarizeComplianceGapsOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

import { verifyProductAgainstPath } from '@/services/compliance'; // Assuming this function is still needed
import { SummarizeComplianceGapsInputSchema, SummarizeComplianceGapsOutputSchema, GapSchema, type SummarizeComplianceGapsInput, type SummarizeComplianceGapsOutput } from '@/types/ai-outputs';


// The wrapper function signature remains the same.
export async function summarizeComplianceGaps(
  input: SummarizeComplianceGapsInput,
): Promise<SummarizeComplianceGapsOutput> {
  return summarizeComplianceGapsFlow(input);
}

// The prompt input schema changes. It no longer needs the rules, but takes the pre-computed gaps.
const PromptInputSchema = z.object({
  productName: z.string(),
  compliancePathName: z.string(),
  isCompliant: z.boolean(),
  gaps: z.array(GapSchema),
});

const prompt = ai.definePrompt({
  name: 'summarizeComplianceGapsPrompt',
  input: { schema: PromptInputSchema },
  // The output is now just the summary string. The other fields are known deterministically.
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `SYSTEM: You are an expert EU regulatory compliance auditor AI. Your task is to write a concise, human-readable summary (2-4 sentences) explaining the overall compliance status of a product.
- If the product is compliant, state this clearly and positively.
- If the product is not compliant, state this and briefly mention the number and type of gaps found.
- Be neutral and factual. Do not add any text or explanation outside of the summary.

USER_DATA:
"""
Product Name: {{{productName}}}
Compliance Path: {{{compliancePathName}}}
Is Compliant: {{{isCompliant}}}
{{#if gaps}}
Compliance Gaps:
{{#each gaps}}
- {{regulation}}: {{issue}}
{{/each}}
{{/if}}
"""
`,
});

const summarizeComplianceGapsFlow = ai.defineFlow(
  {
    name: 'summarizeComplianceGapsFlow',
    inputSchema: SummarizeComplianceGapsInputSchema,
    outputSchema: SummarizeComplianceGapsOutputSchema,
  },
  async ({ product, compliancePath }) => {
    // Step 1: Deterministically find compliance gaps.
    const { isCompliant, gaps } = await verifyProductAgainstPath(
      product,
      compliancePath,
    );

    // Step 2: Use AI to generate a human-readable summary.
    const { output } = await prompt({
      productName: product.productName,
      compliancePathName: compliancePath.name,
      isCompliant,
      gaps,
    });

    if (!output) {
      throw new Error('AI failed to generate a compliance summary.');
    }
    
    // Step 3: Combine deterministic results with AI summary.
    return {
      isCompliant,
      gaps,
      complianceSummary: output.summary,
    };
  },
);
