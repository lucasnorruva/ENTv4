
'use server';
/**
 * @fileOverview An AI agent for analyzing textile composition and sustainability.
 *
 * - analyzeTextileComposition - Analyzes textile data for fiber content and risks.
 * - AnalyzeTextileInput - The input type for the function.
 * - AnalyzeTextileOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AnalyzeTextileInputSchema = z.object({
  fiberComposition: z
    .array(z.object({ name: z.string(), percentage: z.number() }))
    .describe('The fiber composition of the textile product.'),
  dyeProcess: z.string().optional().describe('Description of the dyeing process used.'),
});
export type AnalyzeTextileInput = z.infer<typeof AnalyzeTextileInputSchema>;

export const AnalyzeTextileOutputSchema = z.object({
  identifiedFibers: z.array(z.object({
      fiber: z.string(),
      type: z.enum(['Natural', 'Synthetic', 'Semi-Synthetic']),
  })).describe('A list of identified fibers and their classification.'),
  microplasticSheddingRisk: z
    .enum(['High', 'Medium', 'Low', 'Minimal'])
    .describe('The estimated risk of microplastic shedding during washing.'),
  dyeSafetyAssessment: z
    .string()
    .describe('A brief assessment of the potential risks associated with the described dye process (e.g., "Azo dyes check recommended").'),
});
export type AnalyzeTextileOutput = z.infer<typeof AnalyzeTextileOutputSchema>;

export async function analyzeTextileComposition(
  input: AnalyzeTextileInput,
): Promise<AnalyzeTextileOutput> {
  return analyzeTextileCompositionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTextilePrompt',
  input: { schema: AnalyzeTextileInputSchema },
  output: { schema: AnalyzeTextileOutputSchema },
  prompt: `SYSTEM: You are a textile sustainability expert with knowledge of materials science and environmental impact. Your task is to analyze textile data.

- Classify each fiber in 'identifiedFibers' as 'Natural' (e.g., cotton, wool), 'Synthetic' (e.g., polyester, nylon), or 'Semi-Synthetic' (e.g., viscose, modal).
- Assess the 'microplasticSheddingRisk'. Synthetic fibers like polyester and nylon have a High risk. Natural fibers have Minimal risk. Blends have Medium/High risk depending on percentage.
- Provide a brief 'dyeSafetyAssessment'. If the dye process mentions "low-impact", "natural dyes", or "Oeko-Tex certified", note that it's positive. Otherwise, if it's vague or mentions specific chemical types, recommend checking against standards like ZDHC MRSL.

USER_DATA:
Fiber Composition:
{{#each fiberComposition}}
- {{name}}: {{percentage}}%
{{/each}}
{{#if dyeProcess}}
Dyeing Process: {{{dyeProcess}}}
{{/if}}
`,
});

const analyzeTextileCompositionFlow = ai.defineFlow(
  {
    name: 'analyzeTextileCompositionFlow',
    inputSchema: AnalyzeTextileInputSchema,
    outputSchema: AnalyzeTextileOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
