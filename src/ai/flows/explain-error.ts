
'use server';
/**
 * @fileOverview An AI agent for explaining technical errors in a user-friendly way.
 *
 * - explainError - Translates a technical error message into a clear explanation.
 * - ExplainErrorInput - The input type for the function.
 * - ExplainErrorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { ExplainErrorInputSchema, ExplainErrorOutputSchema, type ExplainErrorInput, type ExplainErrorOutput } from '@/types/ai-outputs';


export async function explainError(
  input: ExplainErrorInput,
): Promise<ExplainErrorOutput> {
  return explainErrorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainErrorPrompt',
  input: { schema: ExplainErrorInputSchema },
  output: { schema: ExplainErrorOutputSchema },
  prompt: `SYSTEM: You are a helpful AI assistant inside the Norruva DPP platform. Your job is to take technical error messages and translate them into clear, user-friendly explanations.

- **Analyze the error message and context.**
- **Tailor the explanation to the user's role.** An admin might see more technical detail than a supplier.
- **Provide actionable next steps.** Tell the user what they can do to resolve the issue. For example, if a required field is missing, tell them which field.
- **Maintain a helpful, reassuring tone.** Avoid technical jargon.
- **Generate a short, clear title** for the error toast notification.
- **If the error is generic (e.g., "Network Error"), provide general advice like "Please check your internet connection and try again."**

USER_DATA:
Error: {{{errorMessage}}}
Context: {{{context}}}
User Role: {{{userRole}}}
`,
});

const explainErrorFlow = ai.defineFlow(
  {
    name: 'explainErrorFlow',
    inputSchema: ExplainErrorInputSchema,
    outputSchema: ExplainErrorOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
