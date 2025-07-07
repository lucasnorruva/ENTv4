'use server';
/**
 * @fileOverview An AI agent for creating a base product passport from an image.
 *
 * - createProductFromImage - A function that analyzes an image to suggest product details.
 * - CreateProductFromImageInput - The input type for the function.
 * - CreateProductFromImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateProductFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
});
export type CreateProductFromImageInput = z.infer<
  typeof CreateProductFromImageInputSchema
>;

const CreateProductFromImageOutputSchema = z.object({
  productName: z
    .string()
    .describe('A concise and accurate name for the identified product.'),
  productDescription: z
    .string()
    .describe(
      'A detailed, marketing-friendly description of the product, highlighting key visual features.',
    ),
  category: z
    .enum(['Electronics', 'Fashion', 'Home Goods', 'Construction'])
    .describe(
      'The most appropriate category for the product from the provided options.',
    ),
});
export type CreateProductFromImageOutput = z.infer<
  typeof CreateProductFromImageOutputSchema
>;

export async function createProductFromImage(
  input: CreateProductFromImageInput,
): Promise<CreateProductFromImageOutput> {
  return createProductFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createProductFromImagePrompt',
  input: { schema: CreateProductFromImageInputSchema },
  output: { schema: CreateProductFromImageOutputSchema },
  prompt: `SYSTEM: You are an expert product analyst AI. Your task is to analyze the provided product image and generate key details for a new Digital Product Passport.

- Based on the image, identify the product.
- Create a concise but descriptive 'productName'.
- Write a compelling 'productDescription' (2-3 sentences) that highlights the product's visual features and likely use case.
- Classify the product into one of these categories: 'Electronics', 'Fashion', 'Home Goods', 'Construction'.
- Your output must be a JSON object that strictly adheres to the provided schema.

USER_DATA:
{{media url=imageDataUri}}
`,
});

const createProductFromImageFlow = ai.defineFlow(
  {
    name: 'createProductFromImageFlow',
    inputSchema: CreateProductFromImageInputSchema,
    outputSchema: CreateProductFromImageOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
