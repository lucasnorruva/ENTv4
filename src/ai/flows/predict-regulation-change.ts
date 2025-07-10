
'use server';
/**
 * @fileOverview An AI agent for predicting future regulatory changes.
 *
 * - predictRegulationChange - Predicts changes based on input signals.
 * - PredictRegulationChangeInput - The input type for the function.
 * - PredictRegulationChangeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  PredictRegulationChangeInputSchema,
  PredictRegulationChangeOutputSchema,
  type PredictRegulationChangeInput,
  type PredictRegulationChangeOutput,
} from '@/types/ai-outputs';

export async function predictRegulationChange(
  input: PredictRegulationChangeInput,
): Promise<PredictRegulationChangeOutput> {
  return predictRegulationChangeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictRegulationChangePrompt',
  input: { schema: PredictRegulationChangeInputSchema },
  output: { schema: PredictRegulationChangeOutputSchema },
  prompt: `SYSTEM: You are a highly experienced regulatory forecasting AI. You specialize in synthesizing diverse signals into concrete predictions about future regulations for specific industries.
- Analyze the provided signals.
- Formulate a single, specific prediction for the target industry.
- Estimate your confidence and a likely timeframe.
- Identify which existing regulations might be amended or replaced.
- Suggest a single, high-impact proactive step a company should consider.

USER_DATA:
Target Industry: {{{targetIndustry}}}

Signals:
{{#each signals}}
- {{this}}
{{/each}}
`,
});

const predictRegulationChangeFlow = ai.defineFlow(
  {
    name: 'predictRegulationChangeFlow',
    inputSchema: PredictRegulationChangeInputSchema,
    outputSchema: PredictRegulationChangeOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
