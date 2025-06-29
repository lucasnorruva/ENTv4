// src/ai/flows/enhance-passport-information.ts
'use server';

/**
 * @fileOverview An AI agent for enhancing product passport information.
 *
 * - enhancePassportInformation - A function that enhances product passport information.
 * - EnhancePassportInformationInput - The input type for the enhancePassportInformation function.
 * - EnhancePassportInformationOutput - The return type for the enhancePassportInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePassportInformationInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A description of the product.'),
  currentInformation: z.string().describe('The current passport information.'),
});
export type EnhancePassportInformationInput = z.infer<
  typeof EnhancePassportInformationInputSchema
>;

const EnhancePassportInformationOutputSchema = z.object({
  enhancedInformation: z
    .string()
    .describe(
      'The enhanced product passport information with suggestions for improvement.'
    ),
});
export type EnhancePassportInformationOutput = z.infer<
  typeof EnhancePassportInformationOutputSchema
>;

export async function enhancePassportInformation(
  input: EnhancePassportInformationInput
): Promise<EnhancePassportInformationOutput> {
  return enhancePassportInformationFlow(input);
}

const enhancePassportInformationPrompt = ai.definePrompt({
  name: 'enhancePassportInformationPrompt',
  input: {schema: EnhancePassportInformationInputSchema},
  output: {schema: EnhancePassportInformationOutputSchema},
  prompt: `You are an AI assistant specializing in enhancing product passport information to improve search and discovery.

  Based on the product name, description, and current passport information, provide suggestions for improvement.
  Focus on adding relevant attributes and keywords that will make the passport more easily discoverable.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Current Passport Information: {{{currentInformation}}}

  Enhanced Passport Information:`,
});

const enhancePassportInformationFlow = ai.defineFlow(
  {
    name: 'enhancePassportInformationFlow',
    inputSchema: EnhancePassportInformationInputSchema,
    outputSchema: EnhancePassportInformationOutputSchema,
  },
  async input => {
    const {output} = await enhancePassportInformationPrompt(input);
    return output!;
  }
);
