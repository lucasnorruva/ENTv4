// src/types/ai-outputs.ts
/**
 * This file centralizes the output types from our Genkit AI flows.
 * This makes them reusable and easy to import across the application,
 * particularly in the main `types/index.ts` file.
 */

import type { z } from "zod";
import type { AiProduct } from "@/ai/schemas";
import type {
  CalculateSustainabilityInput,
  EsgScoreOutput,
} from "@/ai/flows/calculate-sustainability";
import type {
  AnalyzeProductLifecycleInput,
  AnalyzeProductLifecycleOutput,
} from "@/ai/flows/analyze-product-lifecycle";
import type {
  ClassifyProductInput,
  ClassifyProductOutput,
} from "@/ai/flows/classify-product";
import type {
  SummarizeComplianceGapsInput,
  SummarizeComplianceGapsOutput,
} from "@/ai/flows/summarize-compliance-gaps";
import type {
  SuggestImprovementsInput,
  SuggestImprovementsOutput,
} from "@/ai/flows/enhance-passport-information";
import type {
  GenerateQRLabelTextInput,
  GenerateQRLabelTextOutput,
} from "@/ai/flows/generate-qr-label-text";
import type {
  ValidateProductDataInput,
  ValidateProductDataOutput,
  DataQualityWarning,
} from "@/ai/flows/validate-product-data";
import type {
  AnalyzeBomInput,
  AnalyzeBomOutput,
} from "@/ai/flows/analyze-bom";
import type {
  GenerateProductImageInput,
  GenerateProductImageOutput,
} from "@/ai/flows/generate-product-image";
import type {
  CreateProductFromImageInput,
  CreateProductFromImageOutput,
} from "@/ai/flows/create-product-from-image";
import type {
  GenerateComplianceRulesInput,
  GenerateComplianceRulesOutput,
} from "@/ai/flows/generate-compliance-rules";
import type {
  GenerateProductDescriptionInput,
  GenerateProductDescriptionOutput,
} from "@/ai/flows/generate-product-description";
import type {
  GeneratePcdsInput,
  PcdsOutput,
} from '@/ai/flows/generate-pcds';
import type {
  ProductQuestionInput,
  ProductQuestionOutput,
} from '@/ai/flows/product-qa-flow';
import type {
  PredictLifecycleInput,
  PredictLifecycleOutput,
} from '@/ai/flows/predict-product-lifecycle';
import type {
  ExplainErrorInput,
  ExplainErrorOutput,
} from '@/ai/flows/explain-error';
import type {
  AnalyzeTextileInput,
  AnalyzeTextileOutput,
} from '@/ai/flows/analyze-textile-composition';
import type {
  AnalyzeConstructionMaterialInput,
  AnalyzeConstructionMaterialOutput,
} from '@/ai/flows/analyze-construction-material';
import type {
  AnalyzeProductTransitRiskInput,
  AnalyzeProductTransitRiskOutput,
} from '@/ai/flows/analyze-product-transit-risk';
import type {
  AnalyzeSimulatedRouteInput,
  AnalyzeSimulatedRouteOutput,
} from '@/ai/flows/analyze-simulated-route';


// Re-export AI Product Schema
export type { AiProduct };

// Export Input types
export type {
  CalculateSustainabilityInput,
  AnalyzeProductLifecycleInput,
  ClassifyProductInput,
  SummarizeComplianceGapsInput,
  SuggestImprovementsInput,
  GenerateQRLabelTextInput,
  ValidateProductDataInput,
  AnalyzeBomInput,
  GenerateProductImageInput,
  CreateProductFromImageInput,
  GenerateComplianceRulesInput,
  GenerateProductDescriptionInput,
  GeneratePcdsInput,
  ProductQuestionInput,
  PredictLifecycleInput,
  ExplainErrorInput,
  AnalyzeTextileInput,
  AnalyzeConstructionMaterialInput,
  AnalyzeProductTransitRiskInput,
  AnalyzeSimulatedRouteInput,
};

// Export Output types
export type {
  EsgScoreOutput,
  AnalyzeProductLifecycleOutput,
  ClassifyProductOutput,
  SummarizeComplianceGapsOutput,
  SuggestImprovementsOutput,
  GenerateQRLabelTextOutput,
  ValidateProductDataOutput,
  DataQualityWarning,
  AnalyzeBomOutput,
  GenerateProductImageOutput,
  CreateProductFromImageOutput,
  GenerateComplianceRulesOutput,
  GenerateProductDescriptionOutput,
  PcdsOutput,
  ProductQuestionOutput,
  PredictLifecycleOutput,
  ExplainErrorOutput,
  AnalyzeTextileOutput,
  AnalyzeConstructionMaterialOutput,
  AnalyzeProductTransitRiskOutput,
  AnalyzeSimulatedRouteOutput,
};
