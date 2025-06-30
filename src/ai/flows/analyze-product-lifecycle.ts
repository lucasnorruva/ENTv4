
"use server";

/**
 * @fileOverview An AI agent for analyzing a product's lifecycle impact.
 *
 * - analyzeProductLifecycle - A function that handles the lifecycle analysis.
 * - AnalyzeProductLifecycleInput - The input type for the function.
 * - AnalyzeProductLifecycleOutputSchema - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { AiProductSchema } from "../schemas";

const AnalyzeProductLifecycleInputSchema = z.object({
  product: AiProductSchema,
});
export type AnalyzeProductLifecycleInput = z.infer<
  typeof AnalyzeProductLifecycleInputSchema
>;

const AnalyzeProductLifecycleOutputSchema = z.object({
  carbonFootprint: z.object({
    value: z.number().describe("The estimated carbon footprint value."),
    unit: z
      .string()
      .describe('The unit for the carbon footprint, e.g., "kg CO2-eq".'),
    summary: z
      .string()
      .describe("A brief summary explaining the carbon footprint estimation."),
  }),
  lifecycleStages: z.object({
    manufacturing: z
      .string()
      .describe("Analysis of the manufacturing stage impact."),
    usePhase: z.string().describe("Analysis of the use phase impact."),
    endOfLife: z.string().describe("Analysis of the end-of-life impact."),
  }),
  highestImpactStage: z
    .enum(["Manufacturing", "Use Phase", "End-of-Life"])
    .describe("The lifecycle stage with the highest environmental impact."),
  improvementOpportunities: z
    .array(z.string())
    .describe("A list of suggestions to improve the product lifecycle."),
});
export type AnalyzeProductLifecycleOutput = z.infer<
  typeof AnalyzeProductLifecycleOutputSchema
>;

export async function analyzeProductLifecycle(
  input: AnalyzeProductLifecycleInput,
): Promise<AnalyzeProductLifecycleOutput> {
  return analyzeProductLifecycleFlow(input);
}

const prompt = ai.definePrompt({
  name: "analyzeProductLifecyclePrompt",
  input: { schema: AnalyzeProductLifecycleInputSchema },
  output: { schema: AnalyzeProductLifecycleOutputSchema },
  prompt: `SYSTEM: You are an expert in Life Cycle Assessment (LCA) for consumer products. Your task is to analyze structured product information and generate a lifecycle impact summary.
- Analyze the product's name, description, category, and structured data.
- Consider factors like materials, weight, manufacturing processes/country, and typical end-of-life options for the category.
- For 'carbonFootprint', if exact data isn't available, use reasonable industry averages to make an estimation and note this in the summary.
- The 'improvementOpportunities' should be a list of concrete, actionable suggestions.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{product.productName}}}
Product Description: {{{product.productDescription}}}
Category: {{{product.category}}}

Materials:
{{#each product.materials}}
- Name: {{name}}
{{/each}}

Manufacturing Info:
- Country: {{product.manufacturing.country}}
{{#if product.manufacturing.emissionsKgCo2e}}
- Reported CO2e: {{product.manufacturing.emissionsKgCo2e}}
{{/if}}
"""
`,
});

const analyzeProductLifecycleFlow = ai.defineFlow(
  {
    name: "analyzeProductLifecycleFlow",
    inputSchema: AnalyzeProductLifecycleInputSchema,
    outputSchema: AnalyzeProductLifecycleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
