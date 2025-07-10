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


// generate-compliance-rules
export const GenerateComplianceRulesInputSchema = z.object({
  name: z.string().describe('The name of the compliance path.'),
  regulations: z.array(z.string()).describe('A list of regulations associated with this path.'),
});
export type GenerateComplianceRulesInput = z.infer<typeof GenerateComplianceRulesInputSchema>;
export const GenerateComplianceRulesOutputSchema = z.object({
  minSustainabilityScore: z.number().optional().describe('A suggested minimum ESG score (0-100) for this path.'),
  requiredKeywords: z.array(z.string()).optional().describe('A list of required materials or keywords based on the regulations.'),
  bannedKeywords: z.array(z.string()).optional().describe('A list of banned materials or substances based on the regulations.'),
});
export type GenerateComplianceRulesOutput = z.infer<typeof GenerateComplianceRulesOutputSchema>;


// generate-product-description
export const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  materials: z.array(z.object({ name: z.string() })).describe('A list of key materials.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;
export const GenerateProductDescriptionOutputSchema = z.object({
  productDescription: z.string().describe('The generated product description (2-4 sentences).'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;


// generate-pcds
export const GeneratePcdsInputSchema = z.object({ product: AiProductSchema });
export type GeneratePcdsInput = z.infer<typeof GeneratePcdsInputSchema>;
const PcdsStatementSchema = z.object({
  property: z.string().describe("The specific circularity property (e.g., 'Recycled Content', 'Repairability')."),
  value: z.string().describe("The value or state of the property (e.g., '45%', 'High', 'Yes')."),
  methodology: z.string().optional().describe("The methodology used to determine the value (e.g., 'ISO 14021')."),
});
export const PcdsOutputSchema = z.object({
  header: z.object({
    dppId: z.string().describe("The Digital Product Passport ID."),
    productName: z.string().describe("The name of the product."),
    manufacturer: z.string().describe("The name of the manufacturer/supplier."),
    generationDate: z.string().describe("The date the PCDS was generated (YYYY-MM-DD)."),
  }),
  statements: z.array(PcdsStatementSchema).describe("A list of circularity statements about the product."),
});
export type PcdsOutput = z.infer<typeof PcdsOutputSchema>;


// product-qa-flow
export const ProductQuestionInputSchema = z.object({
  productContext: AiProductSchema.describe('The full data context of the product.'),
  question: z.string().describe("The user's question about the product."),
});
export type ProductQuestionInput = z.infer<typeof ProductQuestionInputSchema>;
export const ProductQuestionOutputSchema = z.object({
  answer: z.string().describe("A helpful and accurate answer to the user's question based only on the provided product context."),
});
export type ProductQuestionOutput = z.infer<typeof ProductQuestionOutputSchema>;


// predict-product-lifecycle
export const PredictLifecycleInputSchema = z.object({ product: AiProductSchema });
export type PredictLifecycleInput = z.infer<typeof PredictLifecycleInputSchema>;
export const PredictLifecycleOutputSchema = z.object({
  predictedLifespanYears: z.number().describe('The AI-predicted operational lifespan of the product in years.'),
  keyFailurePoints: z.array(z.string()).describe('A list of the most likely components or aspects to fail over time.'),
  optimalReplacementTimeYears: z.number().describe('The suggested optimal time in years to replace the product for best value/performance.'),
  confidenceScore: z.number().min(0).max(1).describe('A confidence score (0.0 to 1.0) for the prediction accuracy.'),
});
export type PredictLifecycleOutput = z.infer<typeof PredictLifecycleOutputSchema>;


// explain-error
export const ExplainErrorInputSchema = z.object({
  errorMessage: z.string().describe('The technical error message or code.'),
  context: z.string().describe('The user action or context where the error occurred (e.g., "saving a product", "running compliance check").'),
  userRole: z.string().describe("The role of the user who saw the error."),
});
export type ExplainErrorInput = z.infer<typeof ExplainErrorInputSchema>;
export const ExplainErrorOutputSchema = z.object({
  title: z.string().describe('A short, user-friendly title for the error.'),
  description: z.string().describe('A clear, simple explanation of what went wrong and what the user can do next.'),
});
export type ExplainErrorOutput = z.infer<typeof ExplainErrorOutputSchema>;


// analyze-textile-composition
export const AnalyzeTextileInputSchema = z.object({
  fiberComposition: z.array(z.object({ name: z.string(), percentage: z.number() })).describe('The fiber composition of the textile product.'),
  dyeProcess: z.string().optional().describe('Description of the dyeing process used.'),
});
export type AnalyzeTextileInput = z.infer<typeof AnalyzeTextileInputSchema>;
export const AnalyzeTextileOutputSchema = z.object({
  identifiedFibers: z.array(z.object({
      fiber: z.string(),
      type: z.enum(['Natural', 'Synthetic', 'Semi-Synthetic']),
  })).describe('A list of identified fibers and their classification.'),
  microplasticSheddingRisk: z.enum(['High', 'Medium', 'Low', 'Minimal']).describe('The estimated risk of microplastic shedding during washing.'),
  dyeSafetyAssessment: z.string().describe('A brief assessment of the potential risks associated with the described dye process (e.g., "Azo dyes check recommended").'),
});
export type AnalyzeTextileOutput = z.infer<typeof AnalyzeTextileOutputSchema>;


// analyze-electronics-compliance
export const AnalyzeElectronicsComplianceInputSchema = z.object({ product: AiProductSchema });
export type AnalyzeElectronicsComplianceInput = z.infer<typeof AnalyzeElectronicsComplianceInputSchema>;
const ComplianceCheckSchema = z.object({
  compliant: z.boolean(),
  reason: z.string().describe("Explanation for the compliance status."),
});
export const AnalyzeElectronicsComplianceOutputSchema = z.object({
  rohs: ComplianceCheckSchema.describe("RoHS compliance assessment."),
  weee: ComplianceCheckSchema.describe("WEEE compliance assessment."),
  ceMarking: ComplianceCheckSchema.describe("CE Marking assessment."),
  summary: z.string().describe("An overall summary of the compliance findings."),
});
export type AnalyzeElectronicsComplianceOutput = z.infer<typeof AnalyzeElectronicsComplianceOutputSchema>;


// analyze-construction-material
export const AnalyzeConstructionMaterialInputSchema = z.object({
  materialName: z.string().describe('The name of the construction material (e.g., "Portland Cement", "Structural Steel").'),
  manufacturingProcess: z.string().optional().describe('A brief description of the manufacturing process (e.g., "Blast Furnace").'),
  recycledContentPercentage: z.number().optional().describe('The percentage of recycled content in the material.'),
});
export type AnalyzeConstructionMaterialInput = z.infer<typeof AnalyzeConstructionMaterialInputSchema>;
export const AnalyzeConstructionMaterialOutputSchema = z.object({
  embodiedCarbon: z.object({
      value: z.number().describe("The estimated embodied carbon value."),
      unit: z.string().default('kgCO2e/kg').describe('The unit for the embodied carbon.'),
      assessment: z.string().describe("A brief explanation of the carbon assessment based on the material and process."),
  }),
  recyclabilityPotential: z.enum(['High', 'Medium', 'Low', 'Not Recyclable']).describe('The potential for this material to be recycled at end-of-life.'),
  complianceNotes: z.array(z.string()).describe('A list of notes regarding potential compliance issues or standards (e.g., "Check local building codes for usage", "May require EPD").'),
});
export type AnalyzeConstructionMaterialOutput = z.infer<typeof AnalyzeConstructionMaterialOutputSchema>;


// analyze-product-transit-risk
export const AnalyzeProductTransitRiskInputSchema = z.object({
  product: z.custom<any>().describe('The product being shipped.'),
  originCountry: z.string().describe('The country of origin for the shipment.'),
  destinationCountry: z.string().describe('The destination country for the shipment.'),
});
export type AnalyzeProductTransitRiskInput = z.infer<typeof AnalyzeProductTransitRiskInputSchema>;
export const AnalyzeProductTransitRiskOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Very High']).describe('The overall assessed risk level for this transit route.'),
  summary: z.string().describe('A concise summary (2-3 sentences) of the key risks and considerations for this specific product.'),
  keyConsiderations: z.array(z.string()).describe('A bulleted list of the most important factors to consider for this route.'),
});
export type ProductTransitRiskAnalysis = z.infer<typeof AnalyzeProductTransitRiskOutputSchema>;


// analyze-simulated-route
export const AnalyzeSimulatedRouteInputSchema = z.object({
  product: z.custom<any>().describe('The product being shipped.'),
  originCountry: z.string().describe('The country of origin for the shipment.'),
  destinationCountry: z.string().describe('The destination country for the shipment.'),
});
export type AnalyzeSimulatedRouteInput = z.infer<typeof AnalyzeSimulatedRouteInputSchema>;
export const AnalyzeSimulatedRouteOutputSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Very High']).describe('The overall assessed risk level for this transit route.'),
  summary: z.string().describe('A concise summary (2-3 sentences) of the key risks and considerations for this specific product on this route.'),
  keyConsiderations: z.array(z.string()).describe('A bulleted list of the most important factors to consider for this route.'),
});
export type AnalyzeSimulatedRouteOutput = z.infer<typeof AnalyzeSimulatedRouteOutputSchema>;


// analyze-food-safety
export const AnalyzeFoodSafetyInputSchema = z.object({
  productName: z.string().describe('The name of the food product.'),
  ingredients: z.array(z.string()).describe('The list of ingredients.'),
  packagingMaterials: z.array(z.string()).describe('The list of packaging materials that come into contact with the food.'),
});
export type AnalyzeFoodSafetyInput = z.infer<typeof AnalyzeFoodSafetyInputSchema>;
export const AnalyzeFoodSafetyOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The overall food safety risk assessment.'),
  potentialAllergens: z.array(z.string()).describe('A list of potential allergens identified from the ingredients.'),
  complianceNotes: z.array(z.string()).describe('A list of notes regarding food contact material compliance (e.g., "Check for BPA in polycarbonate packaging", "Verify compliance with EU 10/2011 for plastics").'),
});
export type AnalyzeFoodSafetyOutput = z.infer<typeof AnalyzeFoodSafetyOutputSchema>;


// classify-hs-code
export const ClassifyHsCodeInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  category: z.string().describe('The general category of the product (e.g., "Electronics", "Fashion").'),
  materials: z.array(z.object({ name: z.string(), percentage: z.number().optional() })).optional().describe("An optional list of the product's key materials."),
});
export type ClassifyHsCodeInput = z.infer<typeof ClassifyHsCodeInputSchema>;
export const ClassifyHsCodeOutputSchema = z.object({
  code: z.string().regex(/^\d{4}\.\d{2}$/, 'HS Code must be in the format XXXX.XX').describe('The 6-digit Harmonized System (HS) code.'),
  description: z.string().describe('The official description of the HS code category.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the classification (0.0 to 1.0).'),
});
export type HsCodeAnalysis = z.infer<typeof ClassifyHsCodeOutputSchema>;


// generate-conformity-declaration
export const GenerateConformityDeclarationInputSchema = z.object({
  product: AiProductSchema,
  companyName: z.string().describe('The legal name of the manufacturer.'),
});
export type GenerateConformityDeclarationInput = z.infer<typeof GenerateConformityDeclarationInputSchema>;
export const GenerateConformityDeclarationOutputSchema = z.object({
  declarationText: z.string().describe('The full text of the Declaration of Conformity in Markdown format.'),
});
export type GenerateConformityDeclarationOutput = z.infer<typeof GenerateConformityDeclarationOutputSchema>;


// generate-component-tests
export const GenerateComponentTestsInputSchema = z.object({
  componentName: z.string().describe('The name of the React component (e.g., "MyButton").'),
  componentCode: z.string().describe('The full source code of the React component.'),
});
export type GenerateComponentTestsInput = z.infer<typeof GenerateComponentTestsInputSchema>;
export const GenerateComponentTestsOutputSchema = z.object({
  testCode: z.string().describe('The generated test code using Jest and React Testing Library.'),
});
export type GenerateComponentTestsOutput = z.infer<typeof GenerateComponentTestsOutputSchema>;
