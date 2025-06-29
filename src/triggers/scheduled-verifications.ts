// src/triggers/scheduled-verifications.ts
"use server";

import { logAuditEvent } from "@/lib/actions";
import { products } from "@/lib/data"; // Import mock products
import { compliancePaths } from "@/lib/compliance-data"; // Import mock compliance paths
import type { CompliancePath, Product } from "@/types";
import { summarizeComplianceGaps } from "@/ai/flows/summarize-compliance-gaps";

/**
 * Runs a daily compliance check on all products pending verification.
 * This function is designed to be triggered by a scheduled cron job.
 * It uses in-memory mock data for development.
 */
export async function runDailyComplianceCheck(): Promise<{
  processed: number;
  passed: number;
  failed: number;
}> {
  console.log(
    "Running scheduled compliance and verification checks (mock mode)...",
  );

  // 1. Create a lookup map for compliance paths
  const compliancePathsMap = new Map<
    string,
    Omit<CompliancePath, "id" | "createdAt" | "updatedAt">
  >();
  compliancePaths.forEach((path) => {
    compliancePathsMap.set(path.category, path);
  });

  if (compliancePathsMap.size === 0) {
    console.warn("No mock compliance paths found. Aborting verification check.");
    return { processed: 0, passed: 0, failed: 0 };
  }

  // 2. Filter for products with 'Pending' verification status from mock data
  const productsToVerify = products.filter(
    (p) => p.verificationStatus === "Pending",
  );

  if (productsToVerify.length === 0) {
    console.log("No mock products are pending verification.");
    return { processed: 0, passed: 0, failed: 0 };
  }

  let processed = 0;
  let passed = 0;
  let failed = 0;

  // 3. Process each product
  for (const product of productsToVerify) {
    processed++;
    const compliancePath = compliancePathsMap.get(product.category);

    let finalStatus: "Verified" | "Failed" = "Verified";
    let finalSummary =
      "Product is compliant with all known rules for its category.";

    if (!compliancePath) {
      finalStatus = "Failed";
      finalSummary = `No compliance path is configured for the product category: "${product.category}".`;
    } else {
      try {
        const { isCompliant, complianceSummary } =
          await summarizeComplianceGaps({
            productName: product.productName,
            productInformation: product.currentInformation,
            compliancePathName: compliancePath.name,
            complianceRules: JSON.stringify(compliancePath.rules),
          });

        finalStatus = isCompliant ? "Verified" : "Failed";
        finalSummary = complianceSummary;
      } catch (error) {
        console.error(
          `AI compliance check failed for product ${product.id}:`,
          error,
        );
        finalStatus = "Failed";
        finalSummary =
          "Automated compliance check could not be completed due to an internal AI error.";
      }
    }

    if (finalStatus === "Verified") {
      passed++;
    } else {
      failed++;
      console.log(
        `Product ${product.id} failed verification. Summary: ${finalSummary}`,
      );
    }

    // 4. Update the product in the mock array and log an audit event
    const productIndex = products.findIndex((p) => p.id === product.id);
    if (productIndex !== -1) {
      const originalProduct = products[productIndex];
      products[productIndex] = {
        ...originalProduct,
        verificationStatus: finalStatus,
        lastVerificationDate: new Date().toISOString(),
        complianceSummary: finalSummary,
      };
    }

    await logAuditEvent(
      "product.verify",
      product.id,
      { status: finalStatus, summary: finalSummary },
      "system",
    );
  }

  console.log(
    `Mock compliance check complete. Processed: ${processed}, Passed: ${passed}, Failed: ${failed}.`,
  );
  return { processed, passed, failed };
}
