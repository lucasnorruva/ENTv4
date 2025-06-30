"use server";

/**
 * @fileOverview An AI agent for generating public-facing summaries for Digital Product Passports.
 *
 * - generateQRLabelText - A function that generates the summary text for a DPP page.
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
      "A concise, consumer-facing summary for a Digital Product Passport page, accessed via a GS1 Digital Link QR code. It should highlight key sustainability or material facts.",
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
  prompt: `You are an expert in creating consumer-facing product summaries for Digital Product Passports, compliant with GS1 Digital Link and EU's ESPR guidelines.
Your task is to generate a concise summary string suitable for display on a public-facing product passport page. This page will be accessed by a consumer scanning a GS1 Digital Link QR code on the product.
The summary should be brief but informative, highlighting key sustainability facts, material composition, or end-of-life instructions, making it easy for a consumer to understand the product's key characteristics at a glance.

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
