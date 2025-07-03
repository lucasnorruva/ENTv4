// src/triggers/scheduled-verifications.ts
'use server';

import {
  getProducts,
  approvePassport,
  rejectPassport,
  logAuditEvent,
  getCompliancePaths,
} from '@/lib/actions';
import { verifyProductAgainstPath } from '@/services/compliance';

/**
 * Runs a daily compliance check on all products.
 * This function is designed to be triggered by a scheduled cron job.
 * It processes pending products and also re-scans verified products
 * to ensure ongoing compliance.
 */
export async function runDailyComplianceCheck(): Promise<{
  processed: number;
  passed: number;
  failed: number;
  rescanned: number;
  newlyFailed: number;
}> {
  console.log('Running scheduled compliance and verification checks...');
  await logAuditEvent('cron.start', 'dailyComplianceCheck', {}, 'system');

  const allProducts = await getProducts('user-admin');
  const compliancePaths = await getCompliancePaths();
  const pathsById = new Map(compliancePaths.map(p => [p.id, p]));

  let passed = 0;
  let failed = 0;
  let newlyFailed = 0;

  const productsToProcess = allProducts.filter(
    p =>
      p.verificationStatus === 'Pending' || p.verificationStatus === 'Verified',
  );

  for (const product of productsToProcess) {
    if (!product.compliancePathId) {
      console.warn(
        `Product ${product.id} has no compliance path and will be skipped.`,
      );
      continue;
    }

    const compliancePath = pathsById.get(product.compliancePathId);
    if (!compliancePath) {
      const reason = `Compliance path '${product.compliancePathId}' not found.`;
      console.warn(`Skipping product ${product.id}: ${reason}`);
      if (product.verificationStatus === 'Pending') {
        await rejectPassport(
          product.id,
          reason,
          [{ regulation: 'Configuration', issue: reason }],
          'system',
        );
        failed++;
      }
      continue;
    }

    const { isCompliant, gaps } = await verifyProductAgainstPath(
      product,
      compliancePath,
    );

    if (product.verificationStatus === 'Pending') {
      if (isCompliant) {
        await approvePassport(product.id, 'system');
        passed++;
      } else {
        const summary = `Product failed verification with ${gaps.length} issue(s).`;
        await rejectPassport(product.id, summary, gaps, 'system');
        failed++;
      }
    } else if (product.verificationStatus === 'Verified') {
      if (!isCompliant) {
        const summary = `Product is no longer compliant due to updated rules. Found ${gaps.length} issue(s).`;
        console.log(`Product ${product.id} failed re-scan. Reason: ${summary}`);
        await rejectPassport(
          product.id,
          summary,
          gaps,
          'system:rescanner',
        );
        await logAuditEvent(
          'compliance.failed_rescan',
          product.id,
          { summary },
          'system',
        );
        newlyFailed++;
      }
    }
  }

  const result = {
    processed: productsToProcess.filter(
      p => p.verificationStatus === 'Pending',
    ).length,
    passed,
    failed,
    rescanned: productsToProcess.filter(
      p => p.verificationStatus === 'Verified',
    ).length,
    newlyFailed,
  };

  console.log(
    `Compliance check complete. Processed: ${result.processed}, Passed: ${result.passed}, Failed: ${result.failed}, Rescanned: ${result.rescanned}, Newly Failed: ${result.newlyFailed}.`,
  );
  await logAuditEvent('cron.end', 'dailyComplianceCheck', result, 'system');

  return result;
}
