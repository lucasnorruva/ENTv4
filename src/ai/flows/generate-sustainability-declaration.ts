
// src/ai/flows/generate-sustainability-declaration.ts
'use server';
/**
 * @fileOverview An AI agent for generating a Sustainability Declaration document for mass balance.
 *
 * - generateSustainabilityDeclaration - A function that generates the declaration text.
 * - GenerateSustainabilityDeclarationInput - The input type for the function.
 * - GenerateSustainabilityDeclarationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateSustainabilityDeclarationInputSchema, GenerateSustainabilityDeclarationOutputSchema, type GenerateSustainabilityDeclarationInput, type GenerateSustainabilityDeclarationOutput } from '@/types/ai-outputs';

export async function generateSustainabilityDeclaration(
  input: GenerateSustainabilityDeclarationInput,
): Promise<GenerateSustainabilityDeclarationOutput> {
  return generateSustainabilityDeclarationFlow(input);
}

const PromptInputSchema = GenerateSustainabilityDeclarationInputSchema.extend({
  currentDate: z
    .string()
    .describe('The current date, formatted as YYYY-MM-DD.'),
});

const prompt = ai.definePrompt({
  name: 'generateSustainabilityDeclarationPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateSustainabilityDeclarationOutputSchema },
  prompt: `SYSTEM: You are a compliance documentation AI specializing in ISCC PLUS and REDcert-EU standards. Your task is to generate a standard Sustainability Declaration in Markdown format based on the provided product and mass balance data.

**Sustainability Declaration (Mass Balance)**

**1. Declaration Number:** \`{{{product.id}}}-MB-{{currentDate}}\`

**2. Certified Company (Economic Operator):**
- Name: \`{{companyName}}\`
- Address: \`[Company Address, City, Country - Placeholder]\`
- Certificate Number: \`{{product.massBalance.certificateNumber}}\`
- Issuing Certification Body: \`{{product.massBalance.certificationBody}}\`

**3. Product Details:**
- Product Name: \`{{{product.productName}}}\`
- GTIN/Batch Number: \`{{product.gtin}}\`

**4. Sustainability Characteristics:**
- **Raw Material:** \`{{#if product.materials}}{{{product.materials.0.name}}}{{else}}Bio-circular Feedstock{{/if}}\`
- **Sustainability Scheme:** \`{{product.massBalance.certificationBody}}\`
- **Method:** Mass Balance
- **Category:** Bio-circular

**5. Greenhouse Gas (GHG) Emissions:**
- **Total GHG Emissions:** \`{{#if product.lifecycle.carbonFootprint}}{{{product.lifecycle.carbonFootprint}}} kgCO2eq per unit{{else}}Not Assessed{{/if}}\`
- **GHG Saving vs. Fossil Comparator:** \`[XX]% - Calculation pending\`
- **Country of Origin (Raw Material):** \`{{#if product.materials}}{{{product.materials.0.origin}}}{{else}}Not specified{{/if}}\`

**6. Declaration of Compliance:**
We declare that the product mentioned above is in conformity with the sustainability requirements of the \`{{product.massBalance.certificationBody}}\` certification scheme. The mass balance bookkeeping has been performed in accordance with the standard's requirements.

**Date:** \`{{currentDate}}\`

---
*This is an automatically generated declaration.*
`,
});

const generateSustainabilityDeclarationFlow = ai.defineFlow(
  {
    name: 'generateSustainabilityDeclarationFlow',
    inputSchema: GenerateSustainabilityDeclarationInputSchema,
    outputSchema: GenerateSustainabilityDeclarationOutputSchema,
  },
  async input => {
    const currentDate = new Date().toISOString().split('T')[0];
    const { output } = await prompt({
      ...input,
      currentDate,
    });
    return output!;
  },
);
