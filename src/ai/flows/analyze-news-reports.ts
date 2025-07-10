
'use server';
/**
 * @fileOverview An AI agent for analyzing news articles for regulatory signals.
 *
 * - analyzeNewsReports - A function that summarizes news content.
 * - AnalyzeNewsInput - The input type for the function.
 * - AnalyzeNewsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AnalyzeNewsInputSchema = z.object({
  articles: z.array(z.object({
    headline: z.string(),
    content: z.string(),
  })).describe('A list of news articles to analyze.'),
});
export type AnalyzeNewsInput = z.infer<typeof AnalyzeNewsInputSchema>;

export const AnalyzeNewsOutputSchema = z.object({
  keyTakeaways: z.array(z.string()).describe('A list of key takeaways or signals related to potential regulatory changes.'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral']).describe('The overall sentiment of the news regarding regulatory pressure.'),
});
export type AnalyzeNewsOutput = z.infer<typeof AnalyzeNewsOutputSchema>;


export async function analyzeNewsReports(
  input: AnalyzeNewsInput,
): Promise<AnalyzeNewsOutput> {
  return analyzeNewsReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeNewsReportsPrompt',
  input: { schema: AnalyzeNewsInputSchema },
  output: { schema: AnalyzeNewsOutputSchema },
  prompt: `SYSTEM: You are an expert policy analyst AI. Your task is to analyze a collection of news articles and extract signals that might indicate future regulatory changes.
- Focus on identifying trends, recurring themes, and calls for new regulations from NGOs, politicians, or scientific bodies.
- Synthesize the information into a few key takeaways.
- Determine the overall sentiment regarding increased regulatory pressure.

USER_ARTICLES:
{{#each articles}}
---
Headline: {{{headline}}}
Content: {{{content}}}
---
{{/each}}
`,
});

const analyzeNewsReportsFlow = ai.defineFlow(
  {
    name: 'analyzeNewsReportsFlow',
    inputSchema: AnalyzeNewsInputSchema,
    outputSchema: AnalyzeNewsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
