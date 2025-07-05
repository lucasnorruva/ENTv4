
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
import { AiProductSchema } from "@/ai/schemas";

const GenerateQRLabelTextInputSchema = z.object({
  product: AiProductSchema,
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
  prompt: `SYSTEM: You are a copywriter assistant that explains product sustainability features in clear, positive language for consumers. Your task is to generate a concise summary for a product's public passport page, dynamically adapting the tone based on its verification status.
- The summary must be brief (1-2 sentences), engaging, and easy for a consumer to understand.
- **Crucially, if the 'verificationStatus' is 'Verified', start the summary with a strong statement of trust and compliance (e.g., "Verified to meet EU standards," or "Independently verified for quality and sustainability,").**
- If the status is not 'Verified', focus only on neutral, factual sustainability highlights from the materials or other data.
- Highlight key sustainability facts, material composition, or end-of-life instructions based on the provided structured data.
- Your output must be a JSON object that strictly adheres to the provided schema. Do not add any text or explanation outside of the JSON structure.

USER_DATA:
"""
Product Name: {{{product.productName}}}
Supplier: {{{product.supplier}}}
Verification Status: {{{product.verificationStatus}}}
Compliance Summary: {{{product.complianceSummary}}}

Materials:
{{#each product.materials}}
- Name: {{name}}, Recycled Content: {{recycledContent}}%
{{/each}}
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
