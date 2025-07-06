// src/services/validation.ts
'use server';

import type { Product, SubmissionChecklist } from '@/types';

/**
 * Validates a product against the submission checklist criteria.
 * This provides a deterministic check for data completeness.
 *
 * @param product The product to validate.
 * @returns A SubmissionChecklist object with the status of each check.
 */
export async function runSubmissionValidation(
  product: Product,
): Promise<SubmissionChecklist> {
  const checklist: SubmissionChecklist = {
    hasBaseInfo: !!(
      product.productName &&
      product.productDescription &&
      product.category
    ),
    hasMaterials: product.materials && product.materials.length > 0,
    hasManufacturing: !!(
      product.manufacturing?.facility && product.manufacturing.country
    ),
    hasLifecycleData: !!(
      product.lifecycle?.expectedLifespan &&
      product.lifecycle.repairabilityScore
    ),
    hasCompliancePath: !!product.compliancePathId,
    passesDataQuality:
      !product.dataQualityWarnings || product.dataQualityWarnings.length === 0,
  };

  return Promise.resolve(checklist);
}

/**
 * Checks if the entire submission checklist is complete.
 * @param checklist The checklist object to evaluate.
 * @returns True if all checks have passed, false otherwise.
 */
export async function isChecklistComplete(
  checklist: SubmissionChecklist,
): Promise<boolean> {
  return Object.values(checklist).every(Boolean);
}
