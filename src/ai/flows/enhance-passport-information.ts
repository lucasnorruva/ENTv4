
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
  prompt: `You are an AI assistant specializing in sustainable product design and EU regulations like ESPR. Your task is to analyze the current product passport information and provide a list of actionable recommendations to improve it.

  Based on the product name and description, analyze the current JSON data.
  Generate a list of 3-5 concrete suggestions. For each suggestion, provide a 'type' (e.g., 'Material', 'Compliance', 'Design', 'Data Quality') and the 'text' of the recommendation. The text should be concise and start with an action verb.

  Do NOT suggest just adding fields to the JSON. Instead, provide high-level advice on how to improve the product or its data quality.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Current Passport Information:
  \`\`\`json
  {{{currentInformation}}}
  \`\`\`
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
