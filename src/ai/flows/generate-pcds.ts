
'use server';
/**
 * @fileOverview An AI agent for generating a Product Circularity Data Sheet (PCDS).
 *
 * - generatePcds - A function that generates PCDS data from product information.
 * - GeneratePcdsInput - The input type for the function.
 * - PcdsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AiProductSchema } from '@/ai/schemas';

const GeneratePcdsInputSchema = z.object({
  product: AiProductSchema,
});
export type GeneratePcdsInput = z.infer<typeof GeneratePcdsInputSchema>;

const PcdsStatementSchema = z.object({
  property: z.string().describe("The specific circularity property (e.g., 'Recycled Content', 'Repairability')."),
  value: z.string().describe("The value or state of the property (e.g., '45%', 'High', 'Yes')."),
  methodology: z.string().optional().describe("The methodology used to determine the value (e.g., 'ISO 14021')."),
});

const PcdsOutputSchema = z.object({
  header: z.object({
    dppId: z.string().describe("The Digital Product Passport ID."),
    productName: z.string().describe("The name of the product."),
    manufacturer: z.string().describe("The name of the manufacturer/supplier."),
    generationDate: z.string().describe("The date the PCDS was generated (YYYY-MM-DD)."),
  }),
  statements: z.array(PcdsStatementSchema).describe("A list of circularity statements about the product."),
});
export type PcdsOutput = z.infer<typeof PcdsOutputSchema>;


export async function generatePcds(input: GeneratePcdsInput): Promise<PcdsOutput> {
  return generatePcdsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePcdsPrompt',
  input: { schema: GeneratePcdsInputSchema.extend({ currentDate: z.string() }) },
  output: { schema: PcdsOutputSchema },
  prompt: `SYSTEM: You are an expert AI in circular economy standards, specifically the Product Circularity Data Sheet (PCDS) framework. Your task is to analyze product data and generate a structured PCDS JSON object.

- For the header, use the product's 'gtin' as the 'dppId'. Extract the product name, and supplier as the manufacturer. Use the provided current date for 'generationDate'.
- Create a list of circularity 'statements' based on the product data provided in the 'product' object.
- Key properties to look for:
  - Recycled Content: Calculate the average recycled content across all materials that have this value defined.
  - Repairability Score: Use the 'lifecycle.repairabilityScore'.
  - Expected Lifespan: Use 'lifecycle.expectedLifespan'.
  - Energy Efficiency Class: Use 'lifecycle.energyEfficiencyClass'.
  - Recyclability of Packaging: Use 'packaging.recyclable'.
  - Removability of Battery: Use 'battery.isRemovable'.
- Formulate the 'value' clearly and concisely (e.g., "7/10", "Class A", "Yes", "45%"). If a value is not available, do not create a statement for that property.
- Your output must be a JSON object that strictly adheres to the provided schema.

USER_DATA:
{{{json product}}}
Current Date: {{{currentDate}}}
`,
});

const generatePcdsFlow = ai.defineFlow(
  {
    name: 'generatePcdsFlow',
    inputSchema: GeneratePcdsInputSchema,
    outputSchema: PcdsOutputSchema,
  },
  async ({ product }) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const { output } = await prompt({ product, currentDate });
    return output!;
  },
);
