'use server';
/**
 * @fileOverview An AI agent for analyzing the risks of a shipping transit route for a specific product.
 *
 * - analyzeProductTransitRisk - Analyzes customs and logistical risks.
 * - AnalyzeProductTransitRiskInput - The input type for the function.
 * - ProductTransitRiskAnalysis - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import {
  AnalyzeProductTransitRiskInputSchema,
  AnalyzeProductTransitRiskOutputSchema,
  type AnalyzeProductTransitRiskInput,
  type ProductTransitRiskAnalysis,
} from '@/types/ai-outputs';

const CustomsDataSchema = z.object({
  region: z.string(),
  summary: z.string(),
  keyDocs: z.array(z.string()),
  tariffs: z.string(),
  riskLevel: z.enum(['High', 'Medium', 'Low']),
  notes: z.string(),
  relatedRegulations: z.array(
    z.object({
      name: z.string(),
      link: z.string().url(),
    }),
  ),
  keywords: z.array(z.string()),
});

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

export async function analyzeProductTransitRisk(
  input: AnalyzeProductTransitRiskInput,
): Promise<ProductTransitRiskAnalysis> {
  return analyzeProductTransitRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProductTransitRiskPrompt',
  input: {
    schema: z.object({
      productName: z.string(),
      productCategory: z.string(),
      originContext: CustomsDataSchema.optional(),
      destinationContext: CustomsDataSchema.optional(),
    }),
  },
  output: { schema: AnalyzeProductTransitRiskOutputSchema },
  prompt: `SYSTEM: You are a world-class global logistics and customs risk analyst AI. Your task is to provide a concise risk assessment for a specific product's shipping route based on the provided country data.

- Analyze the product itself (name, category) and the customs context for the origin and destination countries.
- Pay special attention to product-specific risks. For example, 'Electronics' may have e-waste import restrictions. 'Textiles' may require specific origin certificates.
- Determine an overall 'riskLevel'. 'High' or 'Very High' risk is warranted if either country has high risk, or if the product category is heavily regulated in the destination country (e.g., electronics in the EU).
- Write a 'summary' of 2-3 sentences explaining the primary risks, tailored to the product.
- List the most important product-specific 'keyConsiderations' as a string array.
- Base your analysis *only* on the provided context data. Do not use external knowledge.

PRODUCT CONTEXT:
- Product Name: {{{productName}}}
- Product Category: {{{productCategory}}}

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

const analyzeProductTransitRiskFlow = ai.defineFlow(
  {
    name: 'analyzeProductTransitRiskFlow',
    inputSchema: AnalyzeProductTransitRiskInputSchema,
    outputSchema: AnalyzeProductTransitRiskOutputSchema,
  },
  async ({ product, originCountry, destinationCountry }) => {
    const { originData, destinationData } = getContextForCountries(
      originCountry,
      destinationCountry,
    );
    const { output } = await prompt({
      productName: product.productName,
      productCategory: product.category,
      originContext: originData,
      destinationContext: destinationData,
    });
    return output!;
  },
);
