// src/triggers/on-product-change.ts
// THIS FILE IS A MOCK FOR LOCAL DEVELOPMENT.
// In a real Firebase project, this would be a Cloud Function.
'use server';

import type {
  Product,
  SustainabilityData,
  DataQualityWarning,
} from '../types';
import type { AiProduct } from '../ai/schemas';

import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import { validateProductData } from '@/ai/flows/validate-product-data';
import { getCompanyById } from '../lib/auth';
import { getCompliancePathById } from '../lib/actions';

const runAllAiFlows = async (
  productData: AiProduct,
): Promise<{
  sustainability: SustainabilityData;
  qrLabelText: string;
  dataQualityWarnings: DataQualityWarning[];
}> => {
  console.log(`Running AI flows for product: ${productData.productName}`);
  const [
    esgResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
    validationResult,
  ] = await Promise.all([
    calculateSustainability({ product: productData }),
    generateQRLabelText({ product: productData }),
    classifyProduct({ product: productData }),
    analyzeProductLifecycle({ product: productData }),
    validateProductData({ product: productData }),
  ]);
  console.log(`AI flows completed for product: ${productData.productName}`);

  return {
    sustainability: {
      ...esgResult,
      classification: classificationResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      isCompliant: false, // Will be updated later in the process
      complianceSummary: 'Awaiting compliance analysis.',
    },
    qrLabelText: qrLabelResult.qrLabelText,
    dataQualityWarnings: validationResult.warnings,
  };
};

const calculateCompleteness = (product: Product): number => {
  const fieldsToTrack = [
    { key: 'productName' },
    { key: 'productDescription' },
    { key: 'category' },
    { key: 'materials' },
    { key: 'manufacturing.country' },
    { key: 'packaging.type' },
    { key: 'compliancePathId' },
    { key: 'sustainability.score' },
  ];

  const get = (obj: any, path: string) =>
    path.split('.').reduce((o, i) => o?.[i], obj);

  let completedFields = 0;
  fieldsToTrack.forEach(field => {
    const value = get(product, field.key);
    const isComplete = Array.isArray(value) ? value.length > 0 : !!value;
    if (isComplete) {
      completedFields++;
    }
  });

  return Math.round((completedFields / fieldsToTrack.length) * 100);
};

export async function runDataValidationCheck(product: Product): Promise<{
  sustainability: SustainabilityData;
  qrLabelText: string;
  dataQualityWarnings: DataQualityWarning[];
}> {
  console.log(
    `Processing change for product: ${product.id} - ${product.productName}`,
  );

  const company = await getCompanyById(product.companyId);
  if (!company) {
    throw new Error(
      `Company with ID ${product.companyId} not found for product ${product.id}`,
    );
  }

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: company.name,
    materials: product.materials,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const { sustainability, qrLabelText, dataQualityWarnings } =
    await runAllAiFlows(aiProductInput);

  // Run compliance check if a path is assigned
  if (product.compliancePathId) {
    const path = await getCompliancePathById(product.compliancePathId);
    if (path) {
      console.log(`Running compliance gap analysis against path: ${path.name}`);
      const complianceResult = await summarizeComplianceGaps({
        product: aiProductInput,
        compliancePath: path,
      });
      sustainability.isCompliant = complianceResult.isCompliant;
      sustainability.complianceSummary = complianceResult.complianceSummary;
      sustainability.gaps = complianceResult.gaps;
    }
  }

  // Calculate completeness score based on the newly generated data
  const completenessScore = calculateCompleteness({
    ...product,
    sustainability,
  });

  sustainability.completenessScore = completenessScore;

  return { sustainability, qrLabelText, dataQualityWarnings };
}
