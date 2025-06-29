// src/triggers/scheduled-verifications.ts
'use server';

import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { logAuditEvent } from '@/lib/actions';
import { Collections } from '@/lib/constants';
import { db } from '@/lib/firebase';
import type { CompliancePath, Product } from '@/types';

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

    let verificationStatus: 'Verified' | 'Failed' = 'Verified';
    const failureReasons: string[] = [];

    if (!compliancePath) {
      verificationStatus = 'Failed';
      failureReasons.push(`No compliance path found for category: ${product.category}`);
    } else {
      const { rules } = compliancePath;
      const info = JSON.parse(product.currentInformation);
      const infoString = JSON.stringify(info).toLowerCase();

      // Rule: Minimum sustainability score
      if (rules.minSustainabilityScore && (product.sustainabilityScore ?? 0) < rules.minSustainabilityScore) {
        verificationStatus = 'Failed';
        failureReasons.push(`Sustainability score of ${product.sustainabilityScore} is below the required minimum of ${rules.minSustainabilityScore}.`);
      }

      // Rule: Banned keywords/materials
      rules.bannedKeywords?.forEach(keyword => {
        if (infoString.includes(keyword.toLowerCase())) {
          verificationStatus = 'Failed';
          failureReasons.push(`Product contains banned material/keyword: ${keyword}`);
        }
      });
       
      // Rule: Required keywords/materials
      rules.requiredKeywords?.forEach(keyword => {
        if (!infoString.includes(keyword.toLowerCase())) {
          verificationStatus = 'Failed';
          failureReasons.push(`Product is missing required material/keyword: ${keyword}`);
        }
      });
    }
    
    if (verificationStatus === 'Verified') {
      passed++;
    } else {
      failed++;
      console.log(`Product ${product.id} failed verification. Reasons: ${failureReasons.join(', ')}`);
      // TODO: In a real system, trigger notification to an auditor/compliance officer here.
      // e.g., sendEmail('auditor@example.com', 'Verification Failed', `...`);
    }

    // 4. Update product in batch and log audit event
    const productRef = doc(db, Collections.PRODUCTS, product.id);
    batch.update(productRef, {
      verificationStatus: verificationStatus,
      lastVerificationDate: new Date().toISOString(),
    });

    await logAuditEvent(
      'product.verify',
      product.id,
      { status: verificationStatus, reasons: failureReasons },
      'system'
    );
  }

  // 5. Commit all batched writes
  await batch.commit();

  console.log(`Compliance check complete. Processed: ${processed}, Passed: ${passed}, Failed: ${failed}.`);
  return { processed, passed, failed };
}