'use server';
/**
 * @fileOverview An AI agent for analyzing the risks of a shipping transit route.
 *
 * - analyzeTransitRisk - Analyzes customs and logistical risks between two countries.
 * - AnalyzeTransitRiskInput - The input type for the function.
 * - AnalyzeTransitRiskOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';

const AnalyzeTransitRiskInputSchema = z.object({
  originCountry: z.string().describe('The country of origin for the shipment.'),
  destinationCountry: z
    .string()
    .describe('The destination country for the shipment.'),
});
export type AnalyzeTransitRiskInput = z.infer<
  typeof AnalyzeTransitRiskInputSchema
>;

const AnalyzeTransitRiskOutputSchema = z.object({
  riskLevel: z
    .enum(['Low', 'Medium', 'High', 'Very High'])
    .describe('The overall assessed risk level for this transit route.'),
  summary: z
    .string()
    .describe(
      'A concise summary (2-3 sentences) of the key risks and considerations.',
    ),
  keyConsiderations: z
    .array(z.string())
    .describe(
      'A bulleted list of the most important factors to consider for this route.',
    ),
});
export type AnalyzeTransitRiskOutput = z.infer<
  typeof AnalyzeTransitRiskOutputSchema
>;

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

export async function analyzeTransitRisk(
  input: AnalyzeTransitRiskInput,
): Promise<AnalyzeTransitRiskOutput> {
  return analyzeTransitRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTransitRiskPrompt',
  input: {
    schema: AnalyzeTransitRiskInputSchema.extend({
      originContext: z.any().optional(),
      destinationContext: z.any().optional(),
    }),
  },
  output: { schema: AnalyzeTransitRiskOutputSchema },
  prompt: `SYSTEM: You are a world-class global logistics and customs risk analyst AI. Your task is to provide a concise risk assessment for a shipping route based on the provided country data.

- Determine an overall 'riskLevel' ('Low', 'Medium', 'High', 'Very High'). 'High' or 'Very High' risk is warranted if either country has high risk, or if it's an EU export requiring complex documentation like CBAM.
- Write a 'summary' of 2-3 sentences explaining the primary risks.
- List the most important 'keyConsiderations' as a string array. These should be actionable points for the user.
- Base your analysis *only* on the provided context data. Do not use external knowledge.

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

const analyzeTransitRiskFlow = ai.defineFlow(
  {
    name: 'analyzeTransitRiskFlow',
    inputSchema: AnalyzeTransitRiskInputSchema,
    outputSchema: AnalyzeTransitRiskOutputSchema,
  },
  async ({ originCountry, destinationCountry }) => {
    const { originData, destinationData } = getContextForCountries(
      originCountry,
      destinationCountry,
    );
    const { output } = await prompt({
      originCountry,
      destinationCountry,
      originContext: originData,
      destinationContext: destinationData,
    });
    return output!;
  },
);
