
import { config } from "dotenv";
config();

import "@/ai/schemas.ts";
import "@/ai/flows/enhance-passport-information.ts";
import "@/ai/flows/calculate-sustainability.ts";
import "@/ai/flows/summarize-compliance-gaps.ts";
import "@/ai/flows/classify-product.ts";
import "@/ai/flows/generate-qr-label-text.ts";
import "@/ai/flows/analyze-product-lifecycle.ts";
import "@/ai/flows/validate-product-data.ts";
import "@/ai/flows/generate-product-image.ts";
import "@/ai/flows/generate-conformity-declaration.ts";
import "@/ai/flows/generate-sustainability-declaration.ts";
import "@/ai/flows/analyze-bom.ts";
import "@/ai/flows/create-product-from-image.ts";
import "@/ai/flows/generate-compliance-rules.ts";
import "@/ai/flows/generate-product-description.ts";
import "@/ai/flows/product-qa-flow.ts";
import "@/ai/flows/generate-pcds.ts";
import "@/ai/flows/predict-product-lifecycle.ts";
import "@/ai/flows/explain-error.ts";
import "@/ai/flows/analyze-textile-composition.ts";

import "@/triggers/scheduled-syncs.ts";
import "@/ai/flows/analyze-electronics-compliance.ts";
import "@/ai/flows/generate-component-tests.ts";
import '@/ai/flows/analyze-construction-material.ts';
import '@/ai/flows/analyze-food-safety.ts';
import '@/ai/flows/analyze-product-transit-risk.ts';
import '@/ai/flows/analyze-simulated-route.ts';
import '@/ai/flows/classify-hs-code.ts';
import '@/ai/flows/predict-regulation-change.ts';
import '@/ai/flows/generate-smart-contract.ts';
import '@/ai/flows/analyze-news-reports.ts';

