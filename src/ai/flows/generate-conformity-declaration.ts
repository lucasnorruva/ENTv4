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
import { AiProductSchema } from '@/ai/schemas';

export const GenerateConformityDeclarationInputSchema = z.object({
  product: AiProductSchema,
  companyName: z.string().describe('The legal name of the manufacturer.'),
});
export type GenerateConformityDeclarationInput = z.infer<
  typeof GenerateConformityDeclarationInputSchema
>;

export const GenerateConformityDeclarationOutputSchema = z.object({
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

const PromptInputSchema = GenerateConformityDeclarationInputSchema.extend({
  currentDate: z
    .string()
    .describe('The current date, formatted as YYYY-MM-DD.'),
});

const prompt = ai.definePrompt({
  name: 'generateConformityDeclarationPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateConformityDeclarationOutputSchema },
  prompt: `SYSTEM: You are a meticulous EU compliance documentation AI. Your task is to generate a standard EU Declaration of Conformity (DoC) in Markdown format based on the provided product data. The DoC must be formal and follow a standard structure. Your output must be a single markdown string.

Use the following template. Fill in the placeholders \`[...]\` with the appropriate information from the USER_DATA. If a piece of information is not available, state "Not specified".

**EU Declaration of Conformity**

1.  **Product Model / Product:**
    - Product: \`{{product.productName}}\`
    - Model/Type: \`{{product.gtin}}\`

2.  **Name and address of the manufacturer:**
    - {{companyName}}
    - [Manufacturer Address, City, Postal Code, Country - Use Placeholder if not provided]

3.  **This declaration of conformity is issued under the sole responsibility of the manufacturer.**

4.  **Object of the declaration:**
    - {{product.productName}}, as described in this document.
    - Category: {{product.category}}

5.  **The object of the declaration described above is in conformity with the relevant Union harmonisation legislation:**
    {{#if product.certifications.length}}
    {{#each product.certifications}}
    - \`{{this.name}}\`
    {{/each}}
    {{/if}}
    {{#if product.compliance.rohs.compliant}}
    - Directive 2011/65/EU (RoHS) on the restriction of the use of certain hazardous substances in electrical and electronic equipment.
    {{/if}}
    {{#if product.compliance.ce.marked}}
    - All applicable CE marking directives.
    {{/if}}
    {{#if product.compliance.weee.registered}}
    - Directive 2012/19/EU (WEEE) on waste electrical and electronic equipment.
    {{/if}}
    {{#if product.compliance.eudr.compliant}}
    - Regulation (EU) 2023/1115 (EUDR) on deforestation-free products.
    {{/if}}

6.  **References to the relevant harmonised standards used or references to the other technical specifications in relation to which conformity is declared:**
    - [List specific standards if available, otherwise state 'See listed certifications.']

7.  **Additional information:**
    Signed for and on behalf of: **{{companyName}}**

    Place and date of issue: \`[City], {{currentDate}}\`

    Name, function: \`[Name of Signatory, Title]\`

    Signature:
    \`_________________________\`

USER_DATA:
"""
Product Name: {{{product.productName}}}
GTIN: {{{product.gtin}}}
Category: {{{product.category}}}
Manufacturer: {{{companyName}}}

Certifications:
{{#each product.certifications}}
- {{name}} issued by {{issuer}}
{{/each}}

Compliance Declarations:
- RoHS Compliant: {{#if product.compliance.rohs.compliant}}Yes{{else}}No{{/if}}
- CE Marked: {{#if product.compliance.ce.marked}}Yes{{else}}No{{/if}}
- WEEE Registered: {{#if product.compliance.weee.registered}}Yes{{else}}No{{/if}}
- EUDR Compliant: {{#if product.compliance.eudr.compliant}}Yes{{else}}No{{/if}}
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
    const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const { output } = await prompt({
      ...input,
      currentDate,
    });
    return output!;
  },
);
