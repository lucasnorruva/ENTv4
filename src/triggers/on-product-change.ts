// src/triggers/on-product-change.ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { Collections } from '../lib/constants';
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

export const onProductChange = onDocumentWritten(
  `${Collections.PRODUCTS}/{productId}`,
  async event => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const beforeData = snapshot.before.data() as Product | undefined;
    const afterData = snapshot.after.data() as Product | undefined;

    // Exit if the document was deleted.
    if (!afterData) {
      console.log(
        `Product ${event.params.productId} deleted. No action taken.`,
      );
      return;
    }

    // Key fields to check for changes to decide if we re-run AI flows
    const relevantFieldsChanged =
      !beforeData ||
      beforeData.productName !== afterData.productName ||
      beforeData.productDescription !== afterData.productDescription ||
      beforeData.category !== afterData.category ||
      JSON.stringify(beforeData.materials) !==
        JSON.stringify(afterData.materials) ||
      beforeData.compliancePathId !== afterData.compliancePathId;

    // Exit if this change was just an AI update itself, or if key fields haven't changed.
    // The score of -1 is a sentinel value from the client to force a recalculation.
    if (
      afterData.sustainability?.score !== -1 &&
      beforeData?.sustainability?.score === afterData.sustainability?.score &&
      !relevantFieldsChanged
    ) {
      console.log(
        `Product ${event.params.productId} change was not relevant for AI processing. Skipping.`,
      );
      return;
    }

    console.log(
      `Processing change for product: ${event.params.productId} - ${afterData.productName}`,
    );

    const company = await getCompanyById(afterData.companyId);
    if (!company) {
      console.error(
        `Company with ID ${afterData.companyId} not found for product ${event.params.productId}`,
      );
      return;
    }

    const aiProductInput: AiProduct = {
      productName: afterData.productName,
      productDescription: afterData.productDescription,
      category: afterData.category,
      supplier: company.name,
      materials: afterData.materials,
      manufacturing: afterData.manufacturing,
      certifications: afterData.certifications,
      packaging: afterData.packaging,
      lifecycle: afterData.lifecycle,
      battery: afterData.battery,
      compliance: afterData.compliance,
      verificationStatus: afterData.verificationStatus ?? 'Not Submitted',
      complianceSummary: afterData.sustainability?.complianceSummary,
    };

    const { sustainability, qrLabelText, dataQualityWarnings } =
      await runAllAiFlows(aiProductInput);

    // Run compliance check if a path is assigned
    if (afterData.compliancePathId) {
      const path = await getCompliancePathById(afterData.compliancePathId);
      if (path) {
        console.log(
          `Running compliance gap analysis against path: ${path.name}`,
        );
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
      ...afterData,
      sustainability,
    });

    console.log(`Updating Firestore for product: ${event.params.productId}`);
    return snapshot.after.ref.update({
      sustainability,
      qrLabelText,
      dataQualityWarnings,
      completenessScore,
      isProcessing: false,
    });
  },
);