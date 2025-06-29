"use server";

/**
 * @fileOverview An AI agent for suggesting sustainability improvements to product passports.
 *
 * - enhancePassportInformation - A function that suggests improvements based on product info.
 * - EnhancePassportInformationInput - The input type for the function.
 * - EnhancePassportInformationOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const EnhancePassportInformationInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  productDescription: z.string().describe("A description of the product."),
  currentInformation: z
    .string()
    .describe("The current passport information as a JSON string."),
});
export type EnhancePassportInformationInput = z.infer<
  typeof EnhancePassportInformationInputSchema
>;

const EnhancePassportInformationOutputSchema = z.object({
  enhancedInformation: z
    .string()
    .describe(
      "An updated JSON string for the product passport, including AI-generated suggestions for sustainability improvements (e.g., adding fields for recycled content, carbon footprint, or end-of-life options).",
    ),
});
export type EnhancePassportInformationOutput = z.infer<
  typeof EnhancePassportInformationOutputSchema
>;

export async function enhancePassportInformation(
  input: EnhancePassportInformationInput,
): Promise<EnhancePassportInformationOutput> {
  return enhancePassportInformationFlow(input);
}

const enhancePassportInformationPrompt = ai.definePrompt({
  name: "enhancePassportInformationPrompt",
  input: { schema: EnhancePassportInformationInputSchema },
  output: { schema: EnhancePassportInformationOutputSchema },
  prompt: `You are an AI assistant specializing in sustainable product design.
  Your task is to analyze the current product passport information and suggest improvements to enhance its sustainability.

  Based on the product name and description, analyze the current JSON data.
  Identify missing sustainability-related fields (e.g., "recycled_content_percentage", "carbon_footprint_kg_co2e", "repairability_score", "end_of_life_options").
  Add these fields to the JSON with placeholder values (e.g., "TBD" or 0).
  Return the complete, updated JSON as a single string.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Current Passport Information:
  \`\`\`json
  {{{currentInformation}}}
  \`\`\`
  `,
});

const enhancePassportInformationFlow = ai.defineFlow(
  {
    name: "enhancePassportInformationFlow",
    inputSchema: EnhancePassportInformationInputSchema,
    outputSchema: EnhancePassportInformationOutputSchema,
  },
  async (input) => {
    const { output } = await enhancePassportInformationPrompt(input);
    return output!;
  },
);
