
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
      "A concise, consumer-facing summary for a Digital Product Passport page, accessed via a QR code. It should highlight key sustainability or material facts.",
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
  prompt: `SYSTEM: You are a copywriter assistant that explains product sustainability features in clear, positive language for consumers. Your task is to generate a concise summary for a product's public passport page.
- The summary must be brief (1-2 sentences), engaging, and easy for a consumer to understand.
- Highlight key sustainability facts, material composition, or end-of-life instructions based on the provided data.
- The tone should be positive and informative, but factually based on the passport information.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{productName}}}
Supplier: {{{supplier}}}
Passport Information:
\`\`\`json
{{{currentInformation}}}
\`\`\`
"""
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
