// src/services/compliance.ts
'use server';

import type { Product, CompliancePath, ComplianceGap } from '@/types';

/**
 * Verifies a product against a set of compliance rules.
 * This function provides deterministic, rule-based validation.
 *
 * @param product The product to verify.
 * @param path The compliance path containing the rules.
 * @returns An object containing the compliance status and a list of identified gaps.
 */
export async function verifyProductAgainstPath(
  product: Product,
  path: CompliancePath,
): Promise<{ isCompliant: boolean; gaps: ComplianceGap[] }> {
  const gaps: ComplianceGap[] = [];

  // 1. Check minimum sustainability score
  const score = product.sustainability?.score;
  const minScore = path.rules.minSustainabilityScore;
  if (minScore !== undefined) {
    if (score === undefined || score < minScore) {
      gaps.push({
        regulation: path.name,
        issue: `Product ESG score of ${score ?? 'N/A'} is below the required minimum of ${minScore}.`,
      });
    }
  }

  // 2. Check for banned keywords in materials
  const bannedKeywords = path.rules.bannedKeywords || [];
  if (bannedKeywords.length > 0) {
    product.materials.forEach(material => {
      if (
        bannedKeywords.some(banned =>
          material.name.toLowerCase().includes(banned.toLowerCase()),
        )
      ) {
        gaps.push({
          regulation: path.name,
          issue: `Product contains a banned material: '${material.name}'.`,
        });
      }
    });
  }

  // 3. Check for required keywords in materials
  const requiredKeywords = path.rules.requiredKeywords || [];
  if (requiredKeywords.length > 0) {
    const hasRequiredKeyword = product.materials.some(material =>
      requiredKeywords.some(required =>
        material.name.toLowerCase().includes(required.toLowerCase()),
      ),
    );
    if (!hasRequiredKeyword) {
      gaps.push({
        regulation: path.name,
        issue: `Product is missing a required material. Must include one of: ${requiredKeywords.join(', ')}.`,
      });
    }
  }

  return {
    isCompliant: gaps.length === 0,
    gaps,
  };
}
