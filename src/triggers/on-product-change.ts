// src/triggers/on-product-change.ts
// THIS FILE IS A MOCK FOR LOCAL DEVELOPMENT.
// In a real Firebase project, this would be a Cloud Function.
'use server';

// NOTE: Most of the logic from this file has been centralized into
// the `processProductAi` function within `src/lib/actions.ts`.
// This was done to allow manual re-triggering of the same comprehensive
// AI pipeline that runs on product creation/update.

// This file is kept as a placeholder to represent where a real
// Firestore trigger would live in a production Firebase architecture.
// A real implementation would look something like this:
/*
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { processProductAi } from '@/lib/actions'; // Hypothetical import

export const onProductChange = onDocumentWritten(
  "products/{productId}",
  async (event) => {
    const product = event.data?.after.data();
    const beforeProduct = event.data?.before.data();
    if (!product) {
      return;
    }
    // Logic to prevent infinite loops and check if processing is needed
    if (product.isProcessing || hasChanged(beforeProduct, product)) {
       await processProductAi(product);
    }
  }
);
*/

export async function runDataValidationCheck(
  productId: string,
  userId: string,
) {
  console.log(
    `Mock trigger: Data validation check would run here for product ${productId}. Logic is now in actions.ts.`,
  );
  return Promise.resolve();
}
