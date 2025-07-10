
// src/types/ai-outputs.ts
/**
 * This file centralizes the output types from our Genkit AI flows.
 * This makes them reusable and easy to import across the application,
 * particularly in the main `types/index.ts` file.
 */

import { z } from "zod";
import { AiProductSchema } from "@/ai/schemas";

// Re-export AI Product Schema for convenience
export type { AiProduct } from "@/ai/schemas";

// calculate-sustainability
export const CalculateSustainabilityInputSchema = z.object({ product: AiProductSchema });
export type CalculateSustainabilityInput = z.infer<typeof CalculateSustainabilityInputSchema>;
export const EsgScoreOutputSchema = z.object({
  score: z.number().min(0).max(100).describe("An overall ESG score from 0 to 100, where 100 is most sustainable."),
  environmental: z.number().min(0).max(100).describe("The environmental score from 0-100."),
  social: z.number().min(0).max(100).describe("The social score from 0-100."),
  governance: z.number().min(0).max(100).describe("The governance score from 0-100."),
  summary: z.string().describe("A brief report (2-3 sentences) explaining the rationale for the given score."),
});
export type EsgScoreOutput = z.infer<typeof EsgScoreOutputSchema>;


// analyze-product-lifecycle
export const AnalyzeProductLifecycleInputSchema = z.object({ product: AiProductSchema });
export type AnalyzeProductLifecycleInput = z.infer<typeof AnalyzeProductLifecycleInputSchema>;
export const AnalyzeProductLifecycleOutputSchema = z.object({
  carbonFootprint: z.object({
    value: z.number().describe("The estimated carbon footprint value."),
    unit: z.string().describe('The unit for the carbon footprint, e.g., "kg CO2-eq".'),
    summary: z.string().describe("A brief summary explaining the carbon footprint estimation."),
  }),
  lifecycleStages: z.object({
    manufacturing: z.string().describe("Analysis of the manufacturing stage impact."),
    usePhase: z.string().describe("Analysis of the use phase impact."),
    endOfLife: z.string().describe("Analysis of the end-of-life impact."),
  }),
  highestImpactStage: z.enum(["Manufacturing", "Use Phase", "End-of-Life"]).describe("The lifecycle stage with the highest environmental impact."),
  improvementOpportunities: z.array(z.string()).describe("A list of suggestions to improve the product lifecycle."),
});
export type AnalyzeProductLifecycleOutput = z.infer<typeof AnalyzeProductLifecycleOutputSchema>;


// classify-product
export const ClassifyProductInputSchema = z.object({ product: AiProductSchema });
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;
export const ClassifyProductOutputSchema = z.object({
  esgCategory: z.string().describe("The determined ESG category for the product (e.g., Circular Design, Resource Depletion, Pollution Prevention)."),
  riskScore: z.number().min(0).max(10).describe("An ESG risk score from 0 (low risk) to 10 (high risk), aligned with ISO 14067 principles."),
});
export type ClassifyProductOutput = z.infer<typeof ClassifyProductOutputSchema>;


// summarize-compliance-gaps
export const SummarizeComplianceGapsInputSchema = z.object({ product: z.custom<any>(), compliancePath: z.custom<any>() });
export type SummarizeComplianceGapsInput = z.infer<typeof SummarizeComplianceGapsInputSchema>;
export const GapSchema = z.object({
  regulation: z.string().describe('The regulation or rule that has a compliance gap.'),
  issue: z.string().describe('A detailed description of the compliance gap.'),
});
export const SummarizeComplianceGapsOutputSchema = z.object({
  isCompliant: z.boolean().describe('A boolean indicating if the product is fully compliant with all rules. This should be false if any gaps are found.'),
  complianceSummary: z.string().describe('A concise, human-readable summary (2-4 sentences) explaining the overall compliance status. If non-compliant, briefly mention the number of gaps found.'),
  gaps: z.array(GapSchema).optional().describe('A structured list of specific compliance gaps found. If the product is compliant, this should be an empty array or omitted.'),
});
export type SummarizeComplianceGapsOutput = z.infer<typeof SummarizeComplianceGapsOutputSchema>;


// enhance-passport-information
export const SuggestImprovementsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A description of the product.'),
});
export type SuggestImprovementsInput = z.infer<typeof SuggestImprovementsInputSchema>;
const RecommendationSchema = z.object({
  type: z.string().describe("The category of the recommendation (e.g., 'Material', 'Compliance', 'Design', 'Data Quality')."),
  text: z.string().describe("The actionable recommendation text."),
});
export const SuggestImprovementsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe("A list of actionable recommendations for the product."),
});
export type SuggestImprovementsOutput = z.infer<typeof SuggestImprovementsOutputSchema>;


// generate-qr-label-text
export const GenerateQRLabelTextInputSchema = z.object({ product: AiProductSchema });
export type GenerateQRLabelTextInput = z.infer<typeof GenerateQRLabelTextInputSchema>;
export const GenerateQRLabelTextOutputSchema = z.object({
  qrLabelText: z.string().describe("A concise, consumer-facing summary for a Digital Product Passport page, accessed via a QR code. It should highlight key sustainability or material facts."),
});
export type GenerateQRLabelTextOutput = z.infer<typeof GenerateQRLabelTextOutputSchema>;


// validate-product-data
export const ValidateProductDataInputSchema = z.object({ product: AiProductSchema });
export type ValidateProductDataInput = z.infer<typeof ValidateProductDataInputSchema>;
export const DataQualityWarningSchema = z.object({
  field: z.string().describe('The specific field with a potential issue.'),
  warning: z.string().describe('A description of the potential data anomaly.'),
});
export type DataQualityWarning = z.infer<typeof DataQualityWarningSchema>;
export const ValidateProductDataOutputSchema = z.object({
  warnings: z.array(DataQualityWarningSchema).describe('A list of data quality warnings. If the data is clean, this will be an empty array.'),
});
export type ValidateProductDataOutput = z.infer<typeof ValidateProductDataOutputSchema>;


// analyze-bom
export const AnalyzeBomInputSchema = z.object({ bomText: z.string().describe('The unstructured Bill of Materials text.') });
export type AnalyzeBomInput = z.infer<typeof AnalyzeBomInputSchema>;
const AnalyzedMaterialSchema = z.object({
  name: z.string().describe('The identified name of the material or component.'),
  percentage: z.number().optional().describe('The percentage of this material in the product, if specified.'),
  origin: z.string().optional().describe('The origin country, if specified.'),
});
export const AnalyzeBomOutputSchema = z.object({
  materials: z.array(AnalyzedMaterialSchema).describe('A structured list of materials extracted from the BOM text.'),
});
export type AnalyzeBomOutput = z.infer<typeof AnalyzeBomOutputSchema>;


// generate-product-image
export const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  contextImageDataUri: z.string().optional().describe("An optional reference image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;
export const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().url().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;


// create-product-from-image
export const CreateProductFromImageInputSchema = z.object({
  imageDataUri: z.string().describe("A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type CreateProductFromImageInput = z.infer<typeof CreateProductFromImageInputSchema>;
export const CreateProductFromImageOutputSchema = z.object({
  productName: z.string().describe('A concise and accurate name for the identified product.'),
  productDescription: z.string().describe('A detailed, marketing-friendly description of the product, highlighting key visual features.'),
  category: z.enum(['Electronics', 'Fashion', 'Home Goods', 'Construction', 'Food & Beverage']).describe('The most appropriate category for the product from the provided options.'),
});
export type CreateProductFromImageOutput = z.infer<typeof CreateProductFromImageOutputSchema>;
