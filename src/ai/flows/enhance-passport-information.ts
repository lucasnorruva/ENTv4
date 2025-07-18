
"use server";

/**
 * @fileOverview An AI agent for generating recommendations to improve a product passport.
 *
 * - suggestImprovements - A function that suggests improvements based on product info.
 * - SuggestImprovementsInput - The input type for the function.
 * - SuggestImprovementsOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { SuggestImprovementsInputSchema, SuggestImprovementsOutputSchema, type SuggestImprovementsInput, type SuggestImprovementsOutput } from "@/types/ai-outputs";


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
- Analyze the product's name and description.
- Generate a list of 3-5 concrete suggestions.
- The 'text' for each recommendation must be concise and start with an action verb.
- Focus on high-level advice for improving the product or its data quality, not just adding new JSON fields.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
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
