// src/ai/flows/index.ts
/**
 * This file acts as a barrel, exporting all the individual AI flows
 * from a single module. This simplifies importing them elsewhere in the app.
 * It ONLY exports the async functions. Types should be imported directly from
 * their respective flow files by other modules.
 * This file itself should NOT have a "use server" directive.
 */

export { analyzeProductLifecycle } from './analyze-product-lifecycle';
export { calculateSustainability } from './calculate-sustainability';
export { classifyProduct } from './classify-product';
export { suggestImprovements } from './enhance-passport-information';
export { generateQRLabelText } from './generate-qr-label-text';
export { summarizeComplianceGaps } from './summarize-compliance-gaps';
export { validateProductData } from './validate-product-data';
