"use server";

/**
 * @fileOverview An AI agent for generating QR code label text for products.
 *
 * - generateQRLabelText - A function that generates the label text.
 * - GenerateQRLabelTextInput - The input type for the function.
 * - GenerateQRLabelTextOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateQRLabelTextInputSchema = z.object({
  productName: z.string().describe("The name of the product."),
  supplier: z.string().describe("The name of the product supplier or brand."),
  currentInformation: z
    .string()
    .describe("The current passport information as a JSON string."),
});
export type GenerateQRLabelTextInput = z.infer<
  typeof GenerateQRLabelTextInputSchema
>;

const GenerateQRLabelTextOutputSchema = z.object({
  qrLabelText: z
    .string()
    .describe(
      "A concise, GS1 and ESPR-compliant summary string suitable for a QR code label. It should include key product highlights.",
    ),
});
export type GenerateQRLabelTextOutput = z.infer<
  typeof GenerateQRLabelTextOutputSchema
>;

export async function generateQRLabelText(
  input: GenerateQRLabelTextInput,
): Promise<GenerateQRLabelTextOutput> {
  return generateQRLabelTextFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateQRLabelTextPrompt",
  input: { schema: GenerateQRLabelTextInputSchema },
  output: { schema: GenerateQRLabelTextOutputSchema },
  prompt: `You are an expert in product labeling standards, specifically GS1 Digital Link and EU's ESPR.
  Generate a concise summary string for a product label based on the provided information. This text will be embedded in a QR code.
  It must be brief but informative, highlighting key sustainability or material facts.

  Product Name: {{{productName}}}
  Supplier: {{{supplier}}}
  Passport Information:
  \`\`\`json
  {{{currentInformation}}}
  \`\`\`
  `,
});

const generateQRLabelTextFlow = ai.defineFlow(
  {
    name: "generateQRLabelTextFlow",
    inputSchema: GenerateQRLabelTextInputSchema,
    outputSchema: GenerateQRLabelTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
