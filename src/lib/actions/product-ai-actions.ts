// src/lib/actions/product-ai-actions.ts
'use server';

import type { Product, User, SustainabilityData } from '@/types';
import { products as mockProducts } from '@/lib/data';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage as generateProductImageFlow } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { validateProductData } from '@/ai/flows/validate-product-data';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { productQaFlow } from '@/ai/flows/product-qa-flow';
import type { ProductQuestionOutput } from '@/ai/flows/product-qa-flow';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { getProductById, getCompliancePathById } from '@/lib/actions/index';
import { logAuditEvent } from './audit-actions';
import type { AiProduct, DataQualityWarning } from '@/types/ai-outputs';
import { generateProductDescription as generateProductDescriptionFlow } from '@/ai/flows/generate-product-description';
import { generatePcds as generatePcdsFlow } from '@/ai/flows/generate-pcds';
import type { PcdsOutput } from '@/types/ai-outputs';
import { predictProductLifecycle as predictProductLifecycleFlow } from '@/ai/flows/predict-product-lifecycle';
import { explainError as explainErrorFlow } from '@/ai/flows/explain-error';

// --- AI Processing ---

export async function processProductAi(product: Product): Promise<{
  sustainability: SustainabilityData;
  qrLabelText: string;
  dataQualityWarnings: DataQualityWarning[];
}> {
  console.log(`Processing AI flows for product: ${product.id}`);
  const company = await getCompanyById(product.companyId);
  if (!company) {
    throw new Error(`Company not found for product ${product.id}`);
  }

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: company.name,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const [
    esgResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
    validationResult,
  ] = await Promise.all([
    calculateSustainability({ product: aiProductInput }),
    generateQRLabelText({ product: aiProductInput }),
    classifyProduct({ product: aiProductInput }),
    analyzeProductLifecycle({ product: aiProductInput }),
    validateProductData({ product: aiProductInput }),
  ]);

  const sustainability: SustainabilityData = {
    ...esgResult,
    classification: classificationResult,
    lifecycleAnalysis: lifecycleAnalysisResult,
    isCompliant: product.sustainability?.isCompliant || false,
    complianceSummary:
      product.sustainability?.complianceSummary ||
      'Awaiting compliance analysis.',
    gaps: product.sustainability?.gaps,
    lifecyclePrediction: product.sustainability?.lifecyclePrediction,
  };

  return {
    sustainability,
    qrLabelText: qrLabelResult.qrLabelText,
    dataQualityWarnings: validationResult.warnings,
  };
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:recalculate', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].isProcessing = true;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'product.recalculate_score.started',
    productId,
    {},
    userId,
  );
  console.log(`Product ${productId} marked for score recalculation.`);

  setTimeout(async () => {
    try {
      const productToProcess = mockProducts[productIndex];
      if (productToProcess) {
        console.log(`AI processing started for ${product.id}`);
        const { sustainability, qrLabelText, dataQualityWarnings } =
          await processProductAi(productToProcess);

        const currentIndex = mockProducts.findIndex(p => p.id === productId);
        if (currentIndex !== -1) {
          mockProducts[currentIndex].sustainability = sustainability;
          mockProducts[currentIndex].qrLabelText = qrLabelText;
          mockProducts[currentIndex].dataQualityWarnings = dataQualityWarnings;
          mockProducts[currentIndex].isProcessing = false;
          mockProducts[currentIndex].lastUpdated = new Date().toISOString();
          await logAuditEvent(
            'product.recalculate_score.success',
            productId,
            {},
            userId,
          );
          console.log(`AI processing finished for ${product.id}`);
        }
      }
    } catch (error) {
      console.error(`AI processing failed for ${product.id}:`, error);
      const currentIndex = mockProducts.findIndex(p => p.id === productId);
      if (currentIndex !== -1) {
        mockProducts[currentIndex].isProcessing = false;
      }
      await logAuditEvent(
        'product.recalculate_score.failed',
        productId,
        { error: (error as Error).message },
        userId,
      );
    }
  }, 3000);

  return Promise.resolve();
}

export async function runDataValidationCheck(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:validate_data', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].isProcessing = true;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent('product.validation.started', productId, {}, userId);

  setTimeout(async () => {
    try {
      const productToProcess = mockProducts[productIndex];
      if (productToProcess) {
        const company = await getCompanyById(productToProcess.companyId);
        if (!company) throw new Error('Company not found');

        const aiProductInput: AiProduct = {
          productName: product.productName,
          productDescription: product.productDescription,
          category: product.category,
          supplier: company.name,
          materials: product.materials,
          gtin: product.gtin,
          manufacturing: product.manufacturing,
          certifications: product.certifications,
          packaging: product.packaging,
          lifecycle: product.lifecycle,
          battery: product.battery,
          compliance: product.compliance,
          verificationStatus: 'Not Submitted',
          complianceSummary: '',
        };

        const result = await validateProductData({ product: aiProductInput });

        const currentIndex = mockProducts.findIndex(p => p.id === productId);
        if (currentIndex !== -1) {
          mockProducts[currentIndex].dataQualityWarnings = result.warnings;
          mockProducts[currentIndex].isProcessing = false;
          mockProducts[currentIndex].lastUpdated = new Date().toISOString();
          await logAuditEvent(
            'product.validation.success',
            productId,
            { warningCount: result.warnings.length },
            userId,
          );
        }
      }
    } catch (error) {
      const currentIndex = mockProducts.findIndex(p => p.id === productId);
      if (currentIndex !== -1) {
        mockProducts[currentIndex].isProcessing = false;
      }
      await logAuditEvent(
        'product.validation.failed',
        productId,
        { error: (error as Error).message },
        userId,
      );
    }
  }, 3000);

  return Promise.resolve();
}

export async function runComplianceCheck(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:run_compliance', product);

  if (!product.compliancePathId) {
    throw new Error('This product does not have a compliance path assigned.');
  }
  const compliancePath = await getCompliancePathById(product.compliancePathId);
  if (!compliancePath) {
    throw new Error(
      `Compliance path ${product.compliancePathId} could not be found.`,
    );
  }

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].isProcessing = true;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent('product.compliance.started', productId, {}, userId);

  setTimeout(async () => {
    try {
      const productToProcess = mockProducts[productIndex];
      if (productToProcess) {
        const complianceResult = await summarizeComplianceGaps({
          product: productToProcess,
          compliancePath: compliancePath,
        });

        const currentIndex = mockProducts.findIndex(p => p.id === productId);
        if (currentIndex !== -1) {
          const currentSustainability =
            mockProducts[currentIndex].sustainability;
          mockProducts[currentIndex].sustainability = {
            ...currentSustainability!,
            isCompliant: complianceResult.isCompliant,
            complianceSummary: complianceResult.complianceSummary,
            gaps: complianceResult.gaps,
          };
          mockProducts[currentIndex].isProcessing = false;
          mockProducts[currentIndex].lastUpdated = new Date().toISOString();
          await logAuditEvent(
            'product.compliance.checked',
            productId,
            { result: complianceResult },
            userId,
          );
        }
      }
    } catch (error) {
      const currentIndex = mockProducts.findIndex(p => p.id === productId);
      if (currentIndex !== -1) {
        mockProducts[currentIndex].isProcessing = false;
      }
      await logAuditEvent(
        'product.compliance.failed',
        productId,
        { error: (error as Error).message },
        userId,
      );
    }
  }, 3000);

  return Promise.resolve();
}

export async function generateAndSaveProductImage(
  productId: string,
  userId: string,
  contextImageDataUri?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');

  checkPermission(user, 'product:edit', product);

  const { productName, productDescription } = product;
  if (!productName || !productDescription) {
    throw new Error(
      'Product name and description are required to generate an image.',
    );
  }

  console.log(`Generating image for product: ${productName}`);
  const { imageUrl } = await generateProductImageFlow({
    productName,
    productDescription,
    contextImageDataUri,
  });

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].productImage = imageUrl;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  mockProducts[productIndex].updatedAt = new Date().toISOString();

  await logAuditEvent('product.image.generated', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
}

export async function generateAndSaveConformityDeclaration(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:edit', product);

  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found');

  const declarationText = await generateConformityDeclarationText(
    productId,
    userId,
  );
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].declarationOfConformity = declarationText;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent('doc.generated', productId, { type: 'DoC' }, userId);

  return Promise.resolve();
}

export async function generateConformityDeclarationText(
  productId: string,
  userId: string,
): Promise<string> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:edit', product);

  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found for product.');

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const { declarationText } = await generateConformityDeclarationFlow({
    product: aiProductInput,
    companyName: company.name,
  });

  return declarationText;
}

export async function createProductFromImage(
  imageDataUri: string,
  userId: string,
): Promise<any> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  return createProductFromImageFlow({ imageDataUri });
}

export async function analyzeBillOfMaterials(bomText: string) {
  return await analyzeBillOfMaterialsFlow({ bomText });
}

export async function suggestImprovements(input: {
  productName: string;
  productDescription: string;
}) {
  return await suggestImprovementsFlow(input);
}

export async function generateProductDescription(input: {
  productName: string;
  category: string;
  materials: { name: string }[];
}) {
  return generateProductDescriptionFlow(input);
}

export async function generatePcdsForProduct(
  productId: string,
  userId: string,
): Promise<PcdsOutput> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:export_data', product);

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin || product.id,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const pcdsData = await generatePcdsFlow({ product: aiProductInput });

  await logAuditEvent('pcds.generated', productId, {}, userId);

  return pcdsData;
}

export async function runLifecyclePrediction(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:run_prediction');

  await logAuditEvent(
    'product.prediction.started',
    productId,
    { type: 'lifecycle' },
    userId,
  );

  const company = await getCompanyById(product.companyId);
  if (!company) {
    throw new Error(`Company not found for product ${product.id}`);
  }

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: company.name,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const predictionResult = await predictProductLifecycleFlow({
    product: aiProductInput,
  });

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].sustainability = {
    ...mockProducts[productIndex].sustainability!,
    lifecyclePrediction: predictionResult,
  };
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'product.prediction.success',
    productId,
    { type: 'lifecycle' },
    userId,
  );

  return Promise.resolve(mockProducts[productIndex]);
}

export async function askQuestionAboutProduct(
  productId: string,
  question: string,
): Promise<ProductQuestionOutput> {
  await logAuditEvent('product.qa.asked', productId, { question }, 'guest');

  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found.');
  }

  // Map the full Product type to the AiProduct schema for the AI
  const productContext: AiProduct = {
    gtin: product.gtin,
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus,
    complianceSummary: product.sustainability?.complianceSummary,
  };

  return await productQaFlow({ productContext, question });
}

export async function getFriendlyError(error: Error, context: string, user: User): Promise<{ title: string, description: string }> {
  try {
      const explanation = await explainErrorFlow({
          errorMessage: error.message,
          context,
          userRole: user.roles.join(', '),
      });
      return explanation;
  } catch (aiError) {
      console.error("AI error explanation failed:", aiError);
      // Fallback to a generic message if the AI fails
      return {
          title: 'An Unexpected Error Occurred',
          description: `We encountered an issue while trying to ${context}. Please try again later. Original error: ${error.message}`,
      };
  }
}
