// src/triggers/scheduled-verifications.ts
"use server";

import {
  getProducts,
  approvePassport,
  rejectPassport,
  logAuditEvent,
  getCompliancePaths,
} from "@/lib/actions";
import { summarizeComplianceGaps } from "@/ai/flows/summarize-compliance-gaps";
import { verifyProductAgainstPath } from "@/services/compliance";

/**
 * Runs a daily compliance check on all products pending verification.
 * This function is designed to be triggered by a scheduled cron job.
 * It uses server actions to interact with the data layer, ensuring
 * consistency with manual user actions.
 */
export async function runDailyComplianceCheck(): Promise<{
  processed: number;
  passed: number;
  failed: number;
}> {
  console.log("Running scheduled compliance and verification checks...");
  await logAuditEvent("cron.start", "dailyComplianceCheck", {}, "system");

  const [allProducts, compliancePaths] = await Promise.all([
    getProducts(),
    getCompliancePaths(),
  ]);

  const productsToVerify = allProducts.filter(
    (p) => p.verificationStatus === "Pending",
  );

  if (productsToVerify.length === 0) {
    console.log("No products are pending verification.");
    await logAuditEvent(
      "cron.end",
      "dailyComplianceCheck",
      { status: "No products to verify" },
      "system",
    );
    return { processed: 0, passed: 0, failed: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const product of productsToVerify) {
    const compliancePath = compliancePaths.find(
      (p) => p.id === product.compliancePathId,
    );

    if (!compliancePath) {
      const reason = `No compliance path is configured for this product.`;
      const gaps = [{ regulation: "Configuration", issue: reason }];
      console.warn(`Skipping product ${product.id}: ${reason}`);
      await rejectPassport(product.id, reason, gaps, "system");
      failed++;
      continue;
    }

    // First, run deterministic rule-based checks
    const { isCompliant, gaps } = await verifyProductAgainstPath(
      product,
      compliancePath,
    );

    if (isCompliant) {
      // If hard rules pass, approve the passport
      await approvePassport(product.id, "system");
      passed++;
    } else {
      // If hard rules fail, reject with specific reasons
      const summary = `Product failed verification with ${gaps.length} issue(s).`;
      await rejectPassport(product.id, summary, gaps, "system");
      failed++;
    }
  }

  const result = {
    processed: productsToVerify.length,
    passed,
    failed,
  };

  console.log(
    `Compliance check complete. Processed: ${result.processed}, Passed: ${result.passed}, Failed: ${result.failed}.`,
  );
  await logAuditEvent("cron.end", "dailyComplianceCheck", result, "system");

  return result;
}
