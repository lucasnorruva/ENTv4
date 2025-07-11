// src/lib/actions/ai/index.ts
/**
 * @fileoverview This is the central barrel file for all AI-related server actions
 * that are intended to be called from client components. Consolidating exports
 * here simplifies imports and prevents circular dependency issues.
 */
'use server';

export * from '@/ai/flows/analyze-bom';
export * from '@/ai/flows/analyze-construction-material';
export * from '@/ai/flows/analyze-electronics-compliance';
export * from '@/ai/flows/analyze-food-safety';
export * from '@/ai/flows/analyze-news-reports';
export * from '@/ai/flows/analyze-product-lifecycle';
export * from '@/ai/flows/analyze-product-transit-risk';
export * from '@/ai/flows/analyze-simulated-route';
export * from '@/ai/flows/analyze-textile-composition';
export * from '@/ai/flows/calculate-sustainability';
export * from '@/ai/flows/classify-hs-code';
export * from '@/ai/flows/classify-product';
export * from '@/ai/flows/create-product-from-image';
export * from '@/ai/flows/enhance-passport-information';
export * from '@/ai/flows/explain-error';
export * from '@/ai/flows/generate-compliance-rules';
export * from '@/ai/flows/generate-component-tests';
export * from '@/ai/flows/generate-conformity-declaration';
export * from '@/ai/flows/generate-pcds';
export * from '@/ai/flows/generate-product-description';
export * from '@/ai/flows/generate-product-image';
export * from '@/ai/flows/generate-qr-label-text';
export * from '@/ai/flows/generate-smart-contract';
export * from '@/ai/flows/generate-sustainability-declaration';
export * from '@/ai/flows/predict-product-lifecycle';
export * from '@/ai/flows/predict-regulation-change';
export * from '@/ai/flows/product-qa-flow';
export * from '@/ai/flows/summarize-compliance-gaps';
export * from '@/ai/flows/validate-product-data';

export * from '@/lib/actions/product-ai-actions';
export * from '@/lib/actions/regulation-sync-actions';
export * from '@/lib/actions/dev-tool-actions';
