'use server';
/**
 * @fileOverview An AI agent for generating a Declaration of Conformity document.
 *
 * - generateConformityDeclaration - A function that generates the DoC text.
 * - GenerateConformityDeclarationInput - The input type for the function.
 * - GenerateConformityDeclarationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AiProductSchema } from '../schemas';

const GenerateConformityDeclarationInputSchema = z.object({
  product: AiProductSchema,
  companyName: z.string().describe('The legal name of the manufacturer.'),
});
export type GenerateConformityDeclarationInput = z.infer<
  typeof GenerateConformityDeclarationInputSchema
>;

const GenerateConformityDeclarationOutputSchema = z.object({
  declarationText: z
    .string()
    .describe(
      'The full text of the Declaration of Conformity in Markdown format.',
    ),
});
export type GenerateConformityDeclarationOutput = z.infer<
  typeof GenerateConformityDeclarationOutputSchema
>;

export async function generateConformityDeclaration(
  input: GenerateConformityDeclarationInput,
): Promise<GenerateConformityDeclarationOutput> {
  return generateConformityDeclarationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConformityDeclarationPrompt',
  input: { schema: GenerateConformityDeclarationInputSchema },
  output: { schema: GenerateConformityDeclarationOutputSchema },
  prompt: `SYSTEM: You are a meticulous EU compliance documentation AI. Your task is to generate a standard EU Declaration of Conformity (DoC) in Markdown format based on the provided product data. The DoC must be formal and follow a standard structure.

Key elements to include:
1.  A clear title: "EU Declaration of Conformity".
2.  Unique identification of the product (Product Name and GTIN).
3.  Name and address of the manufacturer. Use the provided company name. Assume a placeholder address if not provided.
4.  A statement of sole responsibility for the manufacturer.
5.  Object of the declaration (identification of product allowing traceability).
6.  A statement that the object of the declaration is in conformity with the relevant Union harmonisation legislation.
7.  List all relevant directives and standards mentioned in the product's certifications.
8.  Placeholder for signature (Signed for and on behalf of, Place and date of issue, Name, function, Signature).

USER_DATA:
"""
Product Name: {{{product.productName}}}
GTIN: {{{product.gtin}}}
Manufacturer: {{{companyName}}}

Certifications:
{{#each product.certifications}}
- {{name}} issued by {{issuer}}
{{/each}}

Compliance Declarations:
- RoHS Compliant: {{#if product.compliance.rohsCompliant}}Yes{{else}}No{{/if}}
- CE Marked: {{#if product.compliance.ceMarked}}Yes{{else}}No{{/if}}
"""
`,
});

const generateConformityDeclarationFlow = ai.defineFlow(
  {
    name: 'generateConformityDeclarationFlow',
    inputSchema: GenerateConformityDeclarationInputSchema,
    outputSchema: GenerateConformityDeclarationOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
