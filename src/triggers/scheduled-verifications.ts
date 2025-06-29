// src/triggers/scheduled-verifications.ts
'use server';

import { collection, doc, getDocs, query, writeBatch, where } from 'firebase/firestore';
import { logAuditEvent } from '@/lib/actions';
import { Collections } from '@/lib/constants';
import { db } from '@/lib/firebase';
import type { CompliancePath, Product } from '@/types';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';

/**
 * Runs a daily compliance check on all products pending verification.
 * This function is designed to be triggered by a scheduled cron job.
 */
export async function runDailyComplianceCheck(): Promise<{
  processed: number;
  passed: number;
  failed: number;
}> {
  console.log('Running scheduled compliance and verification checks...');

  // 1. Fetch all compliance paths and create a lookup map
  const compliancePathsSnapshot = await getDocs(collection(db, Collections.COMPLIANCE_PATHS));
  const compliancePathsMap = new Map<string, CompliancePath>();
  compliancePathsSnapshot.forEach(doc => {
    const path = { id: doc.id, ...doc.data() } as CompliancePath;
    compliancePathsMap.set(path.category, path);
  });

  if (compliancePathsMap.size === 0) {
    console.warn('No compliance paths found in Firestore. Aborting verification check.');
    return { processed: 0, passed: 0, failed: 0 };
  }
  
  // 2. Fetch all products with 'Pending' verification status
  const productsQuery = query(collection(db, Collections.PRODUCTS), where('verificationStatus', '==', 'Pending'));
  const productsSnapshot = await getDocs(productsQuery);
  
  if (productsSnapshot.empty) {
    console.log('No products are pending verification.');
    return { processed: 0, passed: 0, failed: 0 };
  }

  const batch = writeBatch(db);
  let processed = 0;
  let passed = 0;
  let failed = 0;

  // 3. Process each product
  for (const productDoc of productsSnapshot.docs) {
    processed++;
    const product = { id: productDoc.id, ...productDoc.data() } as Product;
    const compliancePath = compliancePathsMap.get(product.category);

    let finalStatus: 'Verified' | 'Failed' = 'Verified';
    let finalSummary = 'Product is compliant with all known rules for its category.';

    if (!compliancePath) {
        finalStatus = 'Failed';
        finalSummary = `No compliance path is configured for the product category: "${product.category}".`;
    } else {
        try {
            const { isCompliant, complianceSummary } = await summarizeComplianceGaps({
                productName: product.productName,
                productInformation: product.currentInformation,
                compliancePathName: compliancePath.name,
                complianceRules: JSON.stringify(compliancePath.rules),
            });
            
            finalStatus = isCompliant ? 'Verified' : 'Failed';
            finalSummary = complianceSummary;

        } catch (error) {
            console.error(`AI compliance check failed for product ${product.id}:`, error);
            finalStatus = 'Failed';
            finalSummary = 'Automated compliance check could not be completed due to an internal AI error.';
        }
    }
    
    if (finalStatus === 'Verified') {
      passed++;
    } else {
      failed++;
      console.log(`Product ${product.id} failed verification. Summary: ${finalSummary}`);
    }

    // 4. Update product in batch and log audit event
    const productRef = doc(db, Collections.PRODUCTS, product.id);
    batch.update(productRef, {
      verificationStatus: finalStatus,
      lastVerificationDate: new Date().toISOString(),
      complianceSummary: finalSummary,
    });

    await logAuditEvent(
      'product.verify',
      product.id,
      { status: finalStatus, summary: finalSummary },
      'system'
    );
  }

  // 5. Commit all batched writes
  await batch.commit();

  console.log(`Compliance check complete. Processed: ${processed}, Passed: ${passed}, Failed: ${failed}.`);
  return { processed, passed, failed };
}
