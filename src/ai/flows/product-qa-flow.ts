
'use server';
/**
 * @fileOverview An AI agent that answers questions about a product based on its passport data.
 *
 * This file defines the Genkit flow and prompt for the Product Q&A feature.
 * The main server action that calls this flow is located in `src/lib/actions/product-ai-actions.ts`.
 */

import { ai } from '@/ai/genkit';
import { ProductQuestionInputSchema, ProductQuestionOutputSchema, type ProductQuestionInput, type ProductQuestionOutput } from '@/types/ai-outputs';

export async function productQa(
  input: ProductQuestionInput,
): Promise<ProductQuestionOutput> {
  return productQaFlow(input);
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
