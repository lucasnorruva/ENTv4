// src/ai/flows/analyze-textile-composition.ts
'use server';
/**
 * @fileOverview An AI agent for analyzing textile composition and sustainability.
 *
 * - analyzeTextileComposition - Analyzes textile data for fiber content and risks.
 * - AnalyzeTextileInput - The input type for the function.
 * - AnalyzeTextileOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeTextileInputSchema, AnalyzeTextileOutputSchema, type AnalyzeTextileInput, type AnalyzeTextileOutput } from '@/types/ai-outputs';


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
