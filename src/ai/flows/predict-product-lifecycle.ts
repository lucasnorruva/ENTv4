
'use server';
/**
 * @fileOverview An AI agent for predicting a product's lifecycle characteristics.
 *
 * - predictProductLifecycle - Predicts lifespan, failure points, and optimal replacement time.
 * - PredictLifecycleInput - The input type for the function.
 * - PredictLifecycleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { PredictLifecycleInputSchema, PredictLifecycleOutputSchema, type PredictLifecycleInput, type PredictLifecycleOutput } from '@/types/ai-outputs';


export async function predictProductLifecycle(
  input: PredictLifecycleInput,
): Promise<PredictLifecycleOutput> {
  return predictProductLifecycleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictProductLifecyclePrompt',
  input: { schema: PredictLifecycleInputSchema },
  output: { schema: PredictLifecycleOutputSchema },
  prompt: `SYSTEM: You are an expert reliability engineer and data scientist. Your task is to predict the lifecycle characteristics of a product based on its data.
- Analyze the provided product data, paying close attention to category, materials, and any existing lifecycle information (like repairability score).
- Predict the product's lifespan in years. For electronics, this is typically 3-7 years. For fashion, 1-5 years. For home goods, 5-15 years.
- Identify the most likely 'keyFailurePoints'. For a phone, this might be 'Battery degradation' or 'Screen damage from drops'. For a t-shirt, 'Fabric thinning' or 'Seam failure'.
- Suggest an 'optimalReplacementTimeYears', which may be less than the total lifespan for peak performance.
- Provide a 'confidenceScore' based on how much data is available. More data (materials, repair score) means higher confidence.
- Your output must be a JSON object that strictly adheres to the provided schema.

USER_DATA:
{{{json product}}}
`,
});

const predictProductLifecycleFlow = ai.defineFlow(
  {
    name: 'predictProductLifecycleFlow',
    inputSchema: PredictLifecycleInputSchema,
    outputSchema: PredictLifecycleOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
