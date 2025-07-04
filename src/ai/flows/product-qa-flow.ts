
'use server';
/**
 * @fileOverview An AI agent that answers questions about a product based on its passport data.
 *
 * - askQuestionAboutProduct - A function that handles the Q&A process.
 * - ProductQuestionInput - The input type for the function.
 * - ProductQuestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProductById } from '@/lib/actions';
import { AiProduct, AiProductSchema } from '../schemas';

const ProductQuestionInputSchema = z.object({
  productContext: AiProductSchema.describe(
    'The full data context of the product.',
  ),
  question: z.string().describe("The user's question about the product."),
});
export type ProductQuestionInput = z.infer<typeof ProductQuestionInputSchema>;

const ProductQuestionOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      "A helpful and accurate answer to the user's question based only on the provided product context.",
    ),
});
export type ProductQuestionOutput = z.infer<typeof ProductQuestionOutputSchema>;

// This is the main function that will be called by the server action.
// It orchestrates fetching the data and then calling the flow.
export async function askQuestionAboutProductFlow(
  productId: string,
  question: string,
): Promise<ProductQuestionOutput> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found.');
  }

  // Map the full Product type to the AiProduct schema
  const productContext: AiProduct = {
    gtin: product.gtin,
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus,
    complianceSummary: product.sustainability?.complianceSummary,
  };

  return await productQaFlow({ productContext, question });
}

const prompt = ai.definePrompt({
  name: 'productQaPrompt',
  input: { schema: ProductQuestionInputSchema },
  output: { schema: ProductQuestionOutputSchema },
  prompt: `You are a helpful and friendly product assistant for the company Norruva.
Your goal is to answer user questions about a specific product based *only* on the data provided in the Digital Product Passport.

**Instructions:**
1.  Read the user's question carefully.
2.  Review the provided 'PRODUCT_CONTEXT' JSON data to find the answer.
3.  Formulate a clear, concise, and helpful answer.
4.  **CRITICAL**: If the answer cannot be found in the provided context, you MUST respond with "I'm sorry, but that information is not available in this product's passport." Do NOT use external knowledge or make assumptions.
5.  Keep your answers brief and to the point.

**PRODUCT_CONTEXT:**
\`\`\`json
{{{json productContext}}}
\`\`\`

**User's Question:**
"{{{question}}}"
`,
});

const productQaFlow = ai.defineFlow(
  {
    name: 'productQaFlow',
    inputSchema: ProductQuestionInputSchema,
    outputSchema: ProductQuestionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
