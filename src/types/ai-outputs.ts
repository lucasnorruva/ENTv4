// src/types/ai-outputs.ts
/**
 * This file centralizes the output types from our Genkit AI flows.
 * This makes them reusable and easy to import across the application,
 * particularly in the main `types/index.ts` file.
 */

import type { z } from "zod";
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
};
