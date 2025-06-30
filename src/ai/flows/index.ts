// src/ai/flows/index.ts
/**
 * This file acts as a barrel, exporting all the individual AI flows
 * from a single module. This simplifies importing them elsewhere in the app.
 */
'use server';

export * from './analyze-product-lifecycle';
export * from './calculate-sustainability';
export * from './classify-product';
export * from './enhance-passport-information';
export * from './generate-qr-label-text';
export * from './summarize-compliance-gaps';
export * from './validate-product-data';
