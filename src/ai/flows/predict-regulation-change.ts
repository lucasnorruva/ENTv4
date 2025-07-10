
'use server';
/**
 * @fileOverview An AI agent for predicting future regulatory changes.
 *
 * - predictRegulationChange - Predicts changes based on input signals.
 * - PredictRegulationChangeInput - The input type for the function.
 * - PredictRegulationChangeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PredictRegulationChangeInputSchema = z.object({
  signals: z.array(z.string()).describe('A list of key takeaways and signals from various sources like news, policy papers, etc.'),
  targetIndustry: z.string().describe('The industry to focus the prediction on (e.g., Electronics, Fashion).'),
});
export type PredictRegulationChangeInput = z.infer<typeof PredictRegulationChangeInputSchema>;

export const PredictRegulationChangeOutputSchema = z.object({
  prediction: z.string().describe('A specific, actionable prediction about a potential regulatory change.'),
  confidence: z.number().min(0).max(1).describe('The confidence score (0.0 to 1.0) for this prediction.'),
  timeframe: z.string().describe('The estimated timeframe for this change (e.g., "6-12 months", "1-2 years").'),
  impactedRegulations: z.array(z.string()).describe('A list of existing regulations that might be affected.'),
  suggestedAction: z.string().describe('A suggested proactive action for a company in the target industry.'),
});
export type PredictRegulationChangeOutput = z.infer<typeof PredictRegulationChangeOutputSchema>;

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
