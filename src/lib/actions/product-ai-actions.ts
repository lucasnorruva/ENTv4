// src/lib/actions/product-ai-actions.ts
'use server';

import type { Product, User } from '@/types';
import { products as mockProducts } from '@/lib/data';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage as generateProductImageFlow } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { productQa } from '@/ai/flows/product-qa-flow';
import type { ProductQuestionOutput } from '@/ai/flows/product-qa-flow';
import { getUserById, getCompanyById } from '../auth';
import { checkPermission, PermissionError } from '../permissions';
import { getProductById } from './product-actions';
import { getCompliancePathById } from './compliance-actions';
import { logAuditEvent } from './audit-actions';
import type { AiProduct } from '@/types/ai-outputs';
import { generateProductDescription as generateProductDescriptionFlow } from '@/ai/flows/generate-product-description';
import { generatePcds as generatePcdsFlow } from '@/ai/flows/generate-pcds';
import type { PcdsOutput } from '@/types/ai-outputs';
import { predictProductLifecycle as predictProductLifecycleFlow } from '@/ai/flows/predict-product-lifecycle';
import { explainError as explainErrorFlow } from '@/ai/flows/explain-error';
import { analyzeTextileComposition } from '@/ai/flows/analyze-textile-composition';
import { analyzeConstructionMaterial } from '@/ai/flows/analyze-construction-material';

// The remaining functions are AI actions callable from the UI or other server actions.

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<void> {
  // This is a placeholder as the main logic has been integrated into saveProduct.
  // In a real app, this might trigger a dedicated background job.
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:recalculate', product);
  
  await logAuditEvent(
    'product.recalculate_score.manual_trigger',
    productId,
    {},
    userId,
  );
  
  // The actual recalculation is now part of the saveProduct flow to avoid duplicate logic.
  // We can recommend the user to make a small edit and save to trigger the AI processing.
  console.log(`Manual recalculation trigger for ${productId}. Processing is handled on save.`);

  return Promise.resolve();
}

export async function runDataValidationCheck(
  productId: string,
  userId: string,
): Promise<void> {
  // This is a placeholder. The core logic is in `processProductAi`
  // and is triggered on save. This could be adapted for on-demand checks.
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:validate_data', product);

  await logAuditEvent('product.validation.manual_trigger', productId, {}, userId);
  console.log(`Manual data validation trigger for ${productId}. Processing is handled on save.`);
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

  return await productQa({ productContext, question });
}

export async function getFriendlyError(
  error: any,
  context: string,
  user: User,
) {
  let errorMessage = 'An unexpected error occurred.';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return await explainErrorFlow({
    errorMessage,
    context,
    userRole: user.roles.join(', '),
  });
}

export async function analyzeTextileData(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');
  checkPermission(user, 'product:edit', product);

  if (!product.textile || !product.textile.fiberComposition || product.textile.fiberComposition.length === 0) {
    throw new Error('No textile data available to analyze.');
  }

  const analysisResult = await analyzeTextileComposition(product.textile);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].textileAnalysis = analysisResult;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'product.textile_analysis',
    productId,
    { result: analysisResult },
    userId,
  );
  
  return Promise.resolve(mockProducts[productIndex]);
}

export async function analyzeConstructionData(
    productId: string,
    userId: string,
  ): Promise<Product> {
    const user = await getUserById(userId);
    if (!user) throw new PermissionError('User not found.');
  
    const product = await getProductById(productId, user.id);
    if (!product) throw new Error('Product not found or permission denied.');
    checkPermission(user, 'product:edit', product);
  
    if (product.category !== 'Construction') {
      throw new Error('This analysis is only for construction products.');
    }
  
    const primaryMaterial = product.materials[0];
    if (!primaryMaterial) {
      throw new Error('Product must have at least one material listed for analysis.');
    }
  
    const analysisResult = await analyzeConstructionMaterial({
      materialName: primaryMaterial.name,
      recycledContentPercentage: primaryMaterial.recycledContent,
    });
  
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found in mock data');
  
    mockProducts[productIndex].constructionAnalysis = analysisResult;
    mockProducts[productIndex].lastUpdated = new Date().toISOString();
  
    await logAuditEvent(
      'product.construction_analysis',
      productId,
      { result: analysisResult },
      userId,
    );
    
    return Promise.resolve(mockProducts[productIndex]);
}
