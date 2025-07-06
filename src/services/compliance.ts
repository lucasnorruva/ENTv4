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

  // Rule 1: Check minimum sustainability score
  const score = product.sustainability?.score;
  const minScore = path.rules.minSustainabilityScore;
  if (minScore !== undefined) {
    if (score === undefined || score < minScore) {
      gaps.push({
        regulation: path.name,
        issue: `Product ESG score of ${
          score ?? 'N/A'
        } is below the required minimum of ${minScore}.`,
      });
    }
  }

  // Rule 2: Check for banned keywords in materials
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

  // Rule 3: Check for required keywords in materials
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
        issue: `Product is missing a required material. Must include one of: ${requiredKeywords.join(
          ', ',
        )}.`,
      });
    }
  }

  // Rule 4: Check for specific regulation flags based on the path's regulations
  const compliance = product.compliance || {};
  path.regulations.forEach(reg => {
    switch (reg.toLowerCase()) {
      case 'rohs':
        if (!compliance.rohs?.compliant) {
          gaps.push({
            regulation: 'RoHS',
            issue: 'Product is not declared as RoHS compliant.',
          });
        }
        break;
      case 'reach':
        if (!compliance.reach?.svhcDeclared) {
          gaps.push({
            regulation: 'REACH',
            issue:
              'Product has not been declared for Substances of Very High Concern (SVHC).',
          });
        }
        break;
      case 'weee':
        if (!compliance.weee?.registered) {
          gaps.push({
            regulation: 'WEEE',
            issue: 'Product is not registered with a WEEE compliance scheme.',
          });
        }
        break;
      case 'eudr':
        if (!compliance.eudr?.compliant) {
          gaps.push({
            regulation: 'EUDR',
            issue:
              'Product does not have a valid EU Deforestation-Free Regulation declaration.',
          });
        }
        break;
      case 'eu battery regulation':
        if (!compliance.battery?.compliant) {
          gaps.push({
            regulation: 'EU Battery Regulation',
            issue:
              'Product is not declared as compliant with the EU Battery Regulation.',
          });
        }
        break;
      case 'pfas':
        if (!compliance.pfas?.declared) {
          gaps.push({
            regulation: 'PFAS',
            issue: 'Product has not been declared for PFAS substances.',
          });
        }
        break;
      case 'conflict minerals':
        if (!compliance.conflictMinerals?.compliant) {
          gaps.push({
            regulation: 'Conflict Minerals',
            issue:
              'Product is not declared as compliant with Conflict Minerals regulations.',
          });
        }
        break;
      case 'espr':
        if (!compliance.espr?.compliant) {
            gaps.push({
                regulation: 'ESPR',
                issue: 'Product is not declared as compliant with Ecodesign for Sustainable Products Regulation.'
            });
        }
        break;
    }
  });


  return {
    isCompliant: gaps.length === 0,
    gaps,
  };
}
