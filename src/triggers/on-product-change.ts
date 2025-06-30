// src/triggers/on-product-change.ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { adminDb } from '../lib/firebase-admin';
import { Collections, UserRoles } from '../lib/constants';
import type { Product, SustainabilityData, DataQualityWarning } from '../types';
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
      isCompliant: false,
      complianceSummary: 'Awaiting compliance analysis.',
    },
    qrLabelText: qrLabelResult.qrLabelText,
    dataQualityWarnings: validationResult.warnings,
  };
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
      console.log(`Product ${event.params.productId} deleted. No action taken.`);
      return;
    }

    // Exit if the sustainability data has already been populated and we're not recalculating.
    // The -1 score is a sentinel value to trigger recalculation from the client.
    if (
      afterData.sustainability &&
      afterData.sustainability.score !== undefined &&
      afterData.sustainability.score !== -1
    ) {
      console.log(
        `Product ${event.params.productId} already has AI data. Skipping.`,
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
      verificationStatus: afterData.verificationStatus ?? 'Not Submitted',
      complianceSummary: afterData.sustainability?.complianceSummary,
    };

    const { sustainability, qrLabelText, dataQualityWarnings } =
      await runAllAiFlows(aiProductInput);

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

    console.log(`Updating Firestore for product: ${event.params.productId}`);
    return snapshot.after.ref.update({
      sustainability: sustainability,
      qrLabelText: qrLabelText,
      dataQualityWarnings: dataQualityWarnings,
    });
  },
);
