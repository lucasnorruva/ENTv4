// src/services/compliance.ts
'use server';

import type { Product, CompliancePath, ComplianceGap } from '@/types';

type ComplianceChecker = (
  compliance: Product['compliance'],
) => ComplianceGap | null;

const regulationCheckers: Record<string, ComplianceChecker> = {
  rohs: c =>
    !c?.rohs?.compliant
      ? {
          regulation: 'RoHS',
          issue: 'Product is not declared as RoHS compliant.',
        }
      : null,
  reach: c =>
    !c?.reach?.svhcDeclared
      ? {
          regulation: 'REACH',
          issue:
            'Product has not been declared for Substances of Very High Concern (SVHC).',
        }
      : null,
  weee: c =>
    !c?.weee?.registered
      ? {
          regulation: 'WEEE',
          issue: 'Product is not registered with a WEEE compliance scheme.',
        }
      : null,
  eudr: c =>
    !c?.eudr?.compliant
      ? {
          regulation: 'EUDR',
          issue:
            'Product does not have a valid EU Deforestation-Free Regulation declaration.',
        }
      : null,
  'eu battery regulation': c =>
    !c?.battery?.compliant
      ? {
          regulation: 'EU Battery Regulation',
          issue:
            'Product is not declared as compliant with the EU Battery Regulation.',
        }
      : null,
  pfas: c =>
    !c?.pfas?.declared
      ? {
          regulation: 'PFAS',
          issue: 'Product has not been declared for PFAS substances.',
        }
      : null,
  'conflict minerals': c =>
    !c?.conflictMinerals?.compliant
      ? {
          regulation: 'Conflict Minerals',
          issue:
            'Product is not declared as compliant with Conflict Minerals regulations.',
        }
      : null,
  espr: c =>
    !c?.espr?.compliant
      ? {
          regulation: 'ESPR',
          issue:
            'Product is not declared as compliant with Ecodesign for Sustainable Products Regulation.',
        }
      : null,
};


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
  const compliance = product.compliance || {};

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
  path.regulations.forEach(reg => {
    const checker = regulationCheckers[reg.toLowerCase()];
    if (checker) {
      const gap = checker(compliance);
      if (gap) {
        gaps.push(gap);
      }
    }
  });


  return {
    isCompliant: gaps.length === 0,
    gaps,
  };
}
