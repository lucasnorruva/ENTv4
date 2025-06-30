
"use server";

/**
 * @fileOverview An AI agent for generating recommendations to improve a product passport.
 *
 * - suggestImprovements - A function that suggests improvements based on product info.
 * - SuggestImprovementsInput - The input type for the function.
 * - SuggestImprovementsOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SuggestImprovementsInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  productDescription: z.string().describe("A description of the product."),
  currentInformation: z
    .string()
    .describe("The current passport information as a JSON string."),
});
export type SuggestImprovementsInput = z.infer<
  typeof SuggestImprovementsInputSchema
>;

const RecommendationSchema = z.object({
  type: z
    .string()
    .describe(
      "The category of the recommendation (e.g., 'Material', 'Compliance', 'Design', 'Data Quality').",
    ),
  text: z.string().describe("The actionable recommendation text."),
});

const SuggestImprovementsOutputSchema = z.object({
  recommendations: z
    .array(RecommendationSchema)
    .describe("A list of actionable recommendations for the product."),
});
export type SuggestImprovementsOutput = z.infer<
  typeof SuggestImprovementsOutputSchema
>;

export async function suggestImprovements(
  input: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  return suggestImprovementsFlow(input);
}

const suggestImprovementsPrompt = ai.definePrompt({
  name: "suggestImprovementsPrompt",
  input: { schema: SuggestImprovementsInputSchema },
  output: { schema: SuggestImprovementsOutputSchema },
  prompt: `SYSTEM: You are an AI assistant specializing in sustainable product design and EU regulations like ESPR. Your task is to provide a list of actionable recommendations to improve a product's passport.
- Analyze the product's name, description, and JSON data.
- Generate a list of 3-5 concrete suggestions.
- The 'text' for each recommendation must be concise and start with an action verb.
- Focus on high-level advice for improving the product or its data quality, not just adding new JSON fields.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Current Passport Information:
\`\`\`json
{{{currentInformation}}}
\`\`\`
"""
`,
});

const suggestImprovementsFlow = ai.defineFlow(
  {
    name: "suggestImprovementsFlow",
    inputSchema: SuggestImprovementsInputSchema,
    outputSchema: SuggestImprovementsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestImprovementsPrompt(input);
    return output!;
  },
);
