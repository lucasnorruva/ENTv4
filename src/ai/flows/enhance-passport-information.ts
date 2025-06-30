
"use server";

/**
 * @fileOverview An AI agent for suggesting sustainability improvements to product passports.
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

const SuggestImprovementsOutputSchema = z.object({
  suggestedInformation: z
    .string()
    .describe(
      "An updated JSON string for the product passport, including AI-generated suggestions for sustainability improvements (e.g., adding fields for recycled content, carbon footprint, or end-of-life options).",
    ),
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
  prompt: `You are an AI assistant specializing in sustainable product design and EU regulations like ESPR.
  Your task is to analyze the current product passport information and suggest improvements to enhance its sustainability data.

  Based on the product name and description, analyze the current JSON data.
  Identify key missing sustainability-related fields that are important for compliance and transparency (e.g., "recycled_content_percentage", "carbon_footprint_kg_co2e", "repairability_score", "end_of_life_options").
  Add these fields to the JSON with plausible placeholder values (e.g., "TBD", 0, or a descriptive string like 'e.g., Composting, Recycling').
  Do NOT remove any existing data. Only add new fields.
  Return the complete, updated JSON as a single string in the 'suggestedInformation' output field.

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
