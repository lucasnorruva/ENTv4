'use server';
/**
 * @fileOverview An AI agent for generating product images.
 *
 * - generateProductImage - A function that generates an image based on product details.
 * - GenerateProductImageInput - The input type for the function.
 * - GenerateProductImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z
    .string()
    .describe('A detailed description of the product.'),
  contextImageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional reference image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
});
export type GenerateProductImageInput = z.infer<
  typeof GenerateProductImageInputSchema
>;

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GenerateProductImageOutput = z.infer<
  typeof GenerateProductImageOutputSchema
>;

export async function generateProductImage(
  input: GenerateProductImageInput,
): Promise<GenerateProductImageOutput> {
  return generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async ({ productName, productDescription, contextImageDataUri }) => {
    const textPrompt = `A professional, photorealistic product photograph of a single "${productName}". 
      Description: "${productDescription}".
      The product should be displayed on a clean, bright, neutral light gray background. Minimalist studio lighting.`;

    const prompt = contextImageDataUri
      ? [
          { media: { url: contextImageDataUri } },
          {
            text: `Based on the provided image, generate a new version with the following style: ${textPrompt}`,
          },
        ]
      : textPrompt;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to produce an output.');
    }

    return { imageUrl: media.url };
  },
);
