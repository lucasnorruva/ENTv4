
"use server";

/**
 * @fileOverview An AI agent for summarizing compliance gaps in product data.
 *
 * - summarizeComplianceGaps - A function that analyzes a product against a compliance path.
 * - SummarizeComplianceGapsInput - The input type for the function.
 * - SummarizeComplianceGapsOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SummarizeComplianceGapsInputSchema = z.object({
  productName: z.string().describe("The product's name."),
  productInformation: z
    .string()
    .describe("The JSON data associated with the product passport."),
  compliancePathName: z
    .string()
    .describe("The name of the compliance path being checked against."),
  complianceRules: z
    .string()
    .describe("The JSON representation of the rules for the compliance path."),
});
export type SummarizeComplianceGapsInput = z.infer<
  typeof SummarizeComplianceGapsInputSchema
>;

const GapSchema = z.object({
  regulation: z
    .string()
    .describe("The regulation or rule that has a compliance gap."),
  issue: z.string().describe("A detailed description of the compliance gap."),
});

const SummarizeComplianceGapsOutputSchema = z.object({
  isCompliant: z
    .boolean()
    .describe(
      "A boolean indicating if the product is fully compliant with all rules. This should be false if any gaps are found.",
    ),
  complianceSummary: z
    .string()
    .describe(
      "A concise, human-readable summary (2-4 sentences) explaining the overall compliance status. If non-compliant, briefly mention the number of gaps found.",
    ),
  gaps: z
    .array(GapSchema)
    .optional()
    .describe(
      "A structured list of specific compliance gaps found. If the product is compliant, this should be an empty array or omitted.",
    ),
});

export type SummarizeComplianceGapsOutput = z.infer<
  typeof SummarizeComplianceGapsOutputSchema
>;

export async function summarizeComplianceGaps(
  input: SummarizeComplianceGapsInput,
): Promise<SummarizeComplianceGapsOutput> {
  return summarizeComplianceGapsFlow(input);
}

const prompt = ai.definePrompt({
  name: "summarizeComplianceGapsPrompt",
  input: { schema: SummarizeComplianceGapsInputSchema },
  output: { schema: SummarizeComplianceGapsOutputSchema },
  prompt: `You are an expert EU regulatory compliance auditor AI. Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

Analyze the product's data against the given compliance rules.
- Identify every rule that is not met by the product data.
- If data is insufficient to verify a rule, treat it as a gap.
- Your summary should be neutral and factual.

Product Name: {{{productName}}}
Compliance Path: {{{compliancePathName}}}

Product Passport Data (JSON):
\`\`\`json
{{{productInformation}}}
\`\`\`

Compliance Rules (JSON):
\`\`\`json
{{{complianceRules}}}
\`\`\`
`,
});

const summarizeComplianceGapsFlow = ai.defineFlow(
  {
    name: "summarizeComplianceGapsFlow",
    inputSchema: SummarizeComplianceGapsInputSchema,
    outputSchema: SummarizeComplianceGapsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
