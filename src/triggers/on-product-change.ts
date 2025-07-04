// src/triggers/on-product-change.ts
// THIS FILE IS A MOCK FOR LOCAL DEVELOPMENT.
// In a real Firebase project, this would be a Cloud Function.
'use server';

import { processProductAi } from '@/lib/actions';
import { products as mockProducts } from '@/lib/data';

// NOTE: This mock function simulates the behavior of a Firestore trigger.
// It's called from saveProduct in product-actions.ts for demonstration.
export async function onProductChange(
  productId: string,
  beforeData: any,
  afterData: any,
) {
  console.log(`Trigger fired for product ${productId}.`);

  // Basic check to avoid infinite loops if the trigger is ever directly called
  // in a way that would cause a loop.
  if (
    afterData.isProcessing ||
    JSON.stringify(beforeData) === JSON.stringify(afterData)
  ) {
    console.log(`Skipping processing for product ${productId}.`);
    return;
  }

  // In a real scenario, you'd set the 'isProcessing' flag before starting.
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    mockProducts[productIndex].isProcessing = true;
  }

  try {
    const { sustainability, qrLabelText, dataQualityWarnings } =
      await processProductAi(afterData);
    
    // Update the mock data source
    const finalProductIndex = mockProducts.findIndex(p => p.id === productId);
    if (finalProductIndex !== -1) {
        mockProducts[finalProductIndex].sustainability = sustainability;
        mockProducts[finalProductIndex].qrLabelText = qrLabelText;
        mockProducts[finalProductIndex].dataQualityWarnings = dataQualityWarnings;
        mockProducts[finalProductIndex].isProcessing = false;
        mockProducts[finalProductIndex].lastUpdated = new Date().toISOString();
        console.log(`AI processing finished for ${productId}`);
    }
  } catch (error) {
    console.error(`AI processing failed for ${productId}:`, error);
    // Reset the processing flag on failure
    const finalProductIndex = mockProducts.findIndex(p => p.id === productId);
    if (finalProductIndex !== -1) {
        mockProducts[finalProductIndex].isProcessing = false;
    }
  }
}
