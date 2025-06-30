
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
  prompt: `You are an expert EU regulatory compliance auditor for Digital Product Passports, specializing in regulations like ESPR, REACH, RoHS, and SCIP database requirements. Your task is to analyze a product's data against a specific set of compliance rules and provide a clear, concise summary of your findings, including a list of any specific gaps.

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

  Based on your analysis, determine if the product is compliant. For each rule, check if the product data satisfies it. Pay special attention to chemical composition and check for banned or declarable substances as defined in the rules (simulating REACH/RoHS/SCIP checks).

  Your output must be a JSON object containing:
  1.  'isCompliant': A boolean. Set to false if any gaps are found.
  2.  'gaps': An array of objects, where each object represents a single compliance gap and has 'regulation' and 'issue' fields. If there are no gaps, this should be an empty array.
  3.  'complianceSummary': A 2-4 sentence summary explaining the overall compliance status. If there are gaps, clearly state how many were found (e.g., "The product is non-compliant with 2 issues identified."). If it is compliant, confirm that it meets all specified requirements.
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
