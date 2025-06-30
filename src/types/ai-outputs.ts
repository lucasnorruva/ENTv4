// src/types/ai-outputs.ts
/**
 * This file centralizes the output types from our Genkit AI flows.
 * This makes them reusable and easy to import across the application,
 * particularly in the main `types/index.ts` file.
 */

import type { z } from "zod";
import type { EsgScoreOutputSchema } from "@/ai/flows/calculate-sustainability";
import type { AnalyzeProductLifecycleOutputSchema } from "@/ai/flows/analyze-product-lifecycle";
import type { ClassifyProductOutputSchema } from "@/ai/flows/classify-product";
import type { SummarizeComplianceGapsOutputSchema } from "@/ai/flows/summarize-compliance-gaps";
import type { SuggestImprovementsOutputSchema } from "@/ai/flows/enhance-passport-information";
import type { GenerateQRLabelTextOutputSchema } from "@/ai/flows/generate-qr-label-text";

export type EsgScoreOutput = z.infer<typeof EsgScoreOutputSchema>;
export type AnalyzeProductLifecycleOutput = z.infer<
  typeof AnalyzeProductLifecycleOutputSchema
>;
export type ClassifyProductOutput = z.infer<typeof ClassifyProductOutputSchema>;
export type SummarizeComplianceGapsOutput = z.infer<
  typeof SummarizeComplianceGapsOutputSchema
>;
export type SuggestImprovementsOutput = z.infer<
  typeof SuggestImprovementsOutputSchema
>;
export type GenerateQRLabelTextOutput = z.infer<
  typeof GenerateQRLabelTextOutputSchema
>;
