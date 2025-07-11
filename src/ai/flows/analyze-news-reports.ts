
'use server';
/**
 * @fileOverview An AI agent for analyzing news articles about a specific topic.
 *
 * - analyzeNewsReports - A function that summarizes news content for a given topic.
 * - AnalyzeNewsInput - The input type for the function.
 * - AnalyzeNewsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeNewsInputSchema,
  AnalyzeNewsOutputSchema,
  type AnalyzeNewsInput,
  type AnalyzeNewsOutput,
} from '@/types/ai-outputs';

// Mock news data - in a real app, this would be fetched from a news API
const MOCK_NEWS_DATA: Record<string, any[]> = {
    'PFAS regulations': [
        {
            headline: "EU Parliament Debates Stricter Rules on Microplastic Shedding from Textiles",
            content: "A new report from the European Environment Agency has highlighted the significant contribution of synthetic textiles to microplastic pollution. Members of Parliament are now pushing for amendments to the ESPR to include mandatory shedding tests and labeling for garments containing more than 50% synthetic fibers."
        },
        {
            headline: "Chemical Watch: Calls for Broader PFAS Restrictions in Consumer Electronics",
            content: "Environmental NGOs are petitioning the ECHA to expand the scope of PFAS restrictions under REACH to include all non-essential uses in consumer electronics, citing concerns over bio-accumulation and difficulties in recycling."
        }
    ],
    'default': [
        {
            headline: "Global Supply Chains Face New Sustainability Due Diligence Laws",
            content: "A wave of new legislation across Europe and North America is set to increase the compliance burden on companies, requiring more transparent reporting on environmental and social governance (ESG) metrics."
        }
    ]
}

export async function analyzeNewsReports(
  input: AnalyzeNewsInput,
): Promise<AnalyzeNewsOutput> {
  return analyzeNewsReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeNewsReportsPrompt',
  input: { schema: AnalyzeNewsInputSchema },
  output: { schema: AnalyzeNewsOutputSchema },
  prompt: `SYSTEM: You are an expert policy analyst AI. Your task is to analyze a collection of news articles related to a specific topic and extract signals that might indicate future regulatory changes.
- Focus on identifying trends, recurring themes, and calls for new regulations from NGOs, politicians, or scientific bodies.
- Synthesize the information into a few key takeaways.
- Determine the overall sentiment regarding increased regulatory pressure.

USER_TOPIC:
{{{topic}}}

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
  async ({ topic }) => {
    // In a real application, you would use the 'topic' to call a news API.
    // Here, we use it to select from our mock data.
    const articles = MOCK_NEWS_DATA[topic] || MOCK_NEWS_DATA['default'];

    const { output } = await prompt({
        topic,
        articles,
    });
    return output!;
  },
);

