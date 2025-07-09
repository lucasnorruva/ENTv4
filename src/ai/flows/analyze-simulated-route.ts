
'use server';
/**
 * @fileOverview An AI agent for analyzing the risks of a simulated shipping route.
 *
 * - analyzeSimulatedRoute - Analyzes customs and logistical risks between two countries for a specific product.
 * - AnalyzeSimulatedRouteInput - The input type for the function.
 * - AnalyzeSimulatedRouteOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Product } from '@/types';
import { AnalyzeSimulatedRouteInputSchema, AnalyzeSimulatedRouteOutputSchema, type AnalyzeSimulatedRouteInput, type AnalyzeSimulatedRouteOutput } from '@/types/ai-outputs';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';

// Helper to provide context data to the prompt
const getContextForCountries = (origin: string, destination: string) => {
  const originData = MOCK_CUSTOMS_DATA.find(d =>
    d.keywords.includes(origin.toLowerCase()),
  );
  const destinationData = MOCK_CUSTOMS_DATA.find(d =>
    d.keywords.includes(destination.toLowerCase()),
  );
  return { originData, destinationData };
};

export async function analyzeSimulatedRoute(
  input: AnalyzeSimulatedRouteInput,
): Promise<AnalyzeSimulatedRouteOutput> {
  return analyzeSimulatedRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSimulatedRoutePrompt',
  input: {
    schema: z.object({
      productName: z.string(),
      productCategory: z.string(),
      originCountry: z.string(),
      destinationCountry: z.string(),
      originContext: z.any().optional(),
      destinationContext: z.any().optional(),
    }),
  },
  output: { schema: AnalyzeSimulatedRouteOutputSchema },
  prompt: `SYSTEM: You are a world-class global logistics and customs risk analyst AI. Your task is to provide a concise risk assessment for a specific product's **simulated** shipping route based on the provided country data.

- Analyze the product itself (name, category) and the customs context for the origin and destination countries.
- Pay special attention to product-specific risks. For example, 'Electronics' may have e-waste import restrictions. 'Textiles' may require specific origin certificates.
- Determine an overall 'riskLevel'. 'High' or 'Very High' risk is warranted if either country has high risk, or if the product category is heavily regulated in the destination country (e.g., electronics in the EU).
- Write a 'summary' of 2-3 sentences explaining the primary risks, tailored to the product and route.
- List the most important product-specific 'keyConsiderations' as a string array.
- The output origin and destination must match the input countries.
- Base your analysis *only* on the provided context data. Do not use external knowledge.

PRODUCT CONTEXT:
- Product Name: {{{productName}}}
- Product Category: {{{productCategory}}}

ROUTE:
- Origin: {{{originCountry}}}
- Destination: {{{destinationCountry}}}

ORIGIN CONTEXT:
\`\`\`json
{{{json originContext}}}
\`\`\`

DESTINATION CONTEXT:
\`\`\`json
{{{json destinationContext}}}
\`\`\`
`,
});

const analyzeSimulatedRouteFlow = ai.defineFlow(
  {
    name: 'analyzeSimulatedRouteFlow',
    inputSchema: AnalyzeSimulatedRouteInputSchema,
    outputSchema: AnalyzeSimulatedRouteOutputSchema,
  },
  async ({ product, originCountry, destinationCountry }) => {
    const { originData, destinationData } = getContextForCountries(
      originCountry,
      destinationCountry,
    );
    const { output } = await prompt({
      productName: product.productName,
      productCategory: product.category,
      originCountry,
      destinationCountry,
      originContext: originData,
      destinationContext: destinationData,
    });
    return output!;
  },
);

    