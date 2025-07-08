
'use server';
/**
 * @fileOverview An AI agent for generating React component tests.
 *
 * - generateComponentTests - Generates a test file for a given React component.
 * - GenerateComponentTestsInput - The input type for the function.
 * - GenerateComponentTestsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { GenerateComponentTestsInputSchema, GenerateComponentTestsOutputSchema, type GenerateComponentTestsInput, type GenerateComponentTestsOutput } from '@/types/ai-outputs';


export async function generateComponentTests(
  input: GenerateComponentTestsInput,
): Promise<GenerateComponentTestsOutput> {
  return generateComponentTestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComponentTestsPrompt',
  input: { schema: GenerateComponentTestsInputSchema },
  output: { schema: GenerateComponentTestsOutputSchema },
  prompt: `SYSTEM: You are an expert frontend developer specializing in testing with Jest and React Testing Library. Your task is to generate a comprehensive test file for the provided React component.

**Instructions:**
- The generated code must be a complete, runnable test file.
- Import 'React' from 'react', '{ render, screen }' from '@testing-library/react', and '@testing-library/jest-dom'.
- Create a 'describe' block for the component.
- Write at least 3-4 test cases covering different scenarios:
  1.  A test that checks if the component renders without crashing.
  2.  A test that checks for the presence of key text or elements.
  3.  A test that simulates user interaction (like a click) if applicable.
  4.  A test that checks how the component renders with different props.
- Use 'getByText', 'getByRole', etc., to find elements.
- Use 'expect(...).toBeInTheDocument()' assertions.
- Do not include any explanation or markdown formatting. The output must be only the raw code for the test file.

**COMPONENT NAME:**
{{{componentName}}}

**COMPONENT CODE:**
\`\`\`tsx
{{{componentCode}}}
\`\`\`
`,
});

const generateComponentTestsFlow = ai.defineFlow(
  {
    name: 'generateComponentTestsFlow',
    inputSchema: GenerateComponentTestsInputSchema,
    outputSchema: GenerateComponentTestsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
