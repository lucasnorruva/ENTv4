'use server';
/**
 * @fileOverview An AI agent for generating Solidity smart contracts from compliance rules.
 *
 * - generateSmartContract - Generates a Solidity contract.
 * - GenerateSmartContractInput - The input type for the function.
 * - GenerateSmartContractOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define schemas locally to avoid circular dependency issues
export const GenerateSmartContractInputSchema = z.object({
  pathName: z.string().describe('The name of the compliance path.'),
  rules: z.custom<any>().describe('The structured compliance rules.'),
});
export type GenerateSmartContractInput = z.infer<typeof GenerateSmartContractInputSchema>;

export const GenerateSmartContractOutputSchema = z.object({
  solidityCode: z.string().describe('The generated Solidity smart contract code.'),
});
export type GenerateSmartContractOutput = z.infer<typeof GenerateSmartContractOutputSchema>;


export async function generateSmartContract(
  input: GenerateSmartContractInput,
): Promise<GenerateSmartContractOutput> {
  return generateSmartContractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartContractPrompt',
  input: { schema: GenerateSmartContractInputSchema },
  output: { schema: GenerateSmartContractOutputSchema },
  prompt: `SYSTEM: You are an expert Solidity developer specializing in creating simple, readable, and gas-efficient smart contracts for supply chain and compliance verification. Your task is to generate a basic smart contract based on a set of compliance rules.

**Instructions:**
- The contract should be for Solidity version ^0.8.0.
- The contract name should be derived from the 'pathName', formatted in PascalCase (e.g., "EU Toy Safety" -> "EuToySafetyVerifier").
- Implement a public 'verifyCompliance' function that takes relevant parameters based on the rules provided.
- The function should return a boolean indicating if the product data is compliant.
- Include require() statements with clear error messages for each rule check.
- Add NatSpec comments to explain the contract's purpose and the function's logic.

**USER_RULES:**
\`\`\`json
{{{json rules}}}
\`\`\`
`,
});

const generateSmartContractFlow = ai.defineFlow(
  {
    name: 'generateSmartContractFlow',
    inputSchema: GenerateSmartContractInputSchema,
    outputSchema: GenerateSmartContractOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
