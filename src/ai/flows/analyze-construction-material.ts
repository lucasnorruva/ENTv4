'use server';
/**
 * @fileOverview An AI agent for analyzing construction materials.
 *
 * - analyzeConstructionMaterial - Analyzes material for embodied carbon and other properties.
 * - AnalyzeConstructionMaterialInput - The input type for the function.
 * - AnalyzeConstructionMaterialOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AnalyzeConstructionMaterialInputSchema = z.object({
  materialName: z
    .string()
    .describe('The name of the construction material (e.g., "Portland Cement", "Structural Steel").'),
  manufacturingProcess: z
    .string()
    .optional()
    .describe('A brief description of the manufacturing process (e.g., "Blast Furnace").'),
  recycledContentPercentage: z
    .number()
    .optional()
    .describe('The percentage of recycled content in the material.'),
});
export type AnalyzeConstructionMaterialInput = z.infer<
  typeof AnalyzeConstructionMaterialInputSchema
>;

export const AnalyzeConstructionMaterialOutputSchema = z.object({
  embodiedCarbon: z.object({
      value: z.number().describe("The estimated embodied carbon value."),
      unit: z.string().default('kgCO2e/kg').describe('The unit for the embodied carbon.'),
      assessment: z.string().describe("A brief explanation of the carbon assessment based on the material and process."),
  }),
  recyclabilityPotential: z
    .enum(['High', 'Medium', 'Low', 'Not Recyclable'])
    .describe('The potential for this material to be recycled at end-of-life.'),
  complianceNotes: z
    .array(z.string())
    .describe('A list of notes regarding potential compliance issues or standards (e.g., "Check local building codes for usage", "May require EPD").'),
});
export type AnalyzeConstructionMaterialOutput = z.infer<
  typeof AnalyzeConstructionMaterialOutputSchema
>;

export async function analyzeConstructionMaterial(
  input: AnalyzeConstructionMaterialInput,
): Promise<AnalyzeConstructionMaterialOutput> {
  return analyzeConstructionMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeConstructionMaterialPrompt',
  input: { schema: AnalyzeConstructionMaterialInputSchema },
  output: { schema: AnalyzeConstructionMaterialOutputSchema },
  prompt: `SYSTEM: You are an expert in materials science and sustainability for the construction industry, with knowledge of standards like EN 15804. Your task is to analyze a construction material.

- Based on the material name and process, estimate its 'embodiedCarbon'. Use typical industry values. For example, Portland Cement is high (~0.8 kgCO2e/kg), while timber is low and can be negative. Steel varies greatly based on recycled content.
- Assess the 'recyclabilityPotential'. Steel and aluminum are High. Concrete is Low (can be crushed for aggregate but not reformed). Plastics vary.
- Provide relevant 'complianceNotes'. For materials like cement or steel, suggest checking for an Environmental Product Declaration (EPD). For insulation, mention fire safety standards.

USER_DATA:
Material: {{{materialName}}}
{{#if manufacturingProcess}}
Process: {{{manufacturingProcess}}}
{{/if}}
{{#if recycledContentPercentage}}
Recycled Content: {{{recycledContentPercentage}}}%
{{/if}}
`,
});

const analyzeConstructionMaterialFlow = ai.defineFlow(
  {
    name: 'analyzeConstructionMaterialFlow',
    inputSchema: AnalyzeConstructionMaterialInputSchema,
    outputSchema: AnalyzeConstructionMaterialOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  },
);
