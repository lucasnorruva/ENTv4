// src/lib/actions/product-actions.ts
'use server';

import type {
  Product,
  ComplianceGap,
  ServiceRecord,
  SustainabilityData,
} from '@/types';
import { productFormSchema, type ProductFormValues, bulkProductImportSchema } from '@/schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { getUserById, getCompanyById } from '@/auth';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct, DataQualityWarning } from '@/types/ai-outputs';
import { checkPermission, PermissionError } from '@/permissions';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';

import { products as mockProducts } from '@/data';
import { getWebhooks, getCompliancePathById } from '@/actions/index';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { validateProductData } from '@/ai/flows/validate-product-data';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';

async function processProductAi(product: Product): Promise<{
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
  };

  return {
    sustainability,
    qrLabelText: qrLabelResult.qrLabelText,
    dataQualityWarnings: validationResult.warnings,
  };
}

export async function getProducts(
  userId?: string,
  filters?: { searchQuery?: string },
): Promise<Product[]> {
  const { getProducts: originalGetProducts } = await import('@/data-actions');
  return originalGetProducts(userId, filters);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const { getProductById: originalGetProductById } = await import('@/data-actions');
  return originalGetProductById(id, userId);
}


export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date().toISOString();
  let savedProduct: Product;

  if (productId) {
    const existingProduct = await getProductById(productId, user.id);
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);

    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found in mock data');

    savedProduct = {
      ...mockProducts[productIndex],
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      verificationStatus:
        mockProducts[productIndex].verificationStatus === 'Failed'
          ? 'Not Submitted'
          : mockProducts[productIndex].verificationStatus,
      status:
        mockProducts[productIndex].verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
      isProcessing: true,
    };
    mockProducts[productIndex] = savedProduct;
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company)
      throw new Error(`Company with ID ${user.companyId} not found.`);

    savedProduct = {
      id: newId('pp'),
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
      isProcessing: true,
    };
    mockProducts.unshift(savedProduct);
    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  setTimeout(async () => {
    const productIndex = mockProducts.findIndex(p => p.id === savedProduct.id);
    if (productIndex !== -1) {
      const { sustainability, qrLabelText, dataQualityWarnings } =
        await processProductAi(savedProduct);
      mockProducts[productIndex].sustainability = sustainability;
      mockProducts[productIndex].qrLabelText = qrLabelText;
      mockProducts[productIndex].dataQualityWarnings = dataQualityWarnings;
      mockProducts[productIndex].isProcessing = false;
    }
  }, 3000);

  return Promise.resolve(savedProduct);
}


export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:delete', product);

  const index = mockProducts.findIndex(p => p.id === productId);
  if (index > -1) {
    mockProducts.splice(index, 1);
    await logAuditEvent('product.deleted', productId, {}, userId);
  }
  return Promise.resolve();
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:submit', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].verificationStatus = 'Pending';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
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
      const company = await getCompanyById(product.companyId);
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

      const complianceResult = await summarizeComplianceGaps({
        product: aiProductInput,
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
  const { imageUrl } = await generateProductImage({
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


export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:approve');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  const productHash = await hashProductData(product);
  const blockchainProof = await anchorToPolygon(product.id, productHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const updatedProduct = {
    ...product,
    verificationStatus: 'Verified' as const,
    status: 'Published' as const,
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    ebsiVcId,
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );

  const allWebhooks = await getWebhooks();
  const subscribedWebhooks = allWebhooks.filter(
    wh => wh.status === 'active' && wh.events.includes('product.published'),
  );

  if (subscribedWebhooks.length > 0) {
    console.log(
      `Found ${subscribedWebhooks.length} webhook(s) for product.published event.`,
    );
    for (const webhook of subscribedWebhooks) {
      sendWebhook(webhook, 'product.published', updatedProduct);
    }
  }

  return Promise.resolve(updatedProduct);
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:reject');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    sustainability: {
      ...mockProducts[productIndex].sustainability!,
      complianceSummary: reason,
      gaps,
    },
  };

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  return Promise.resolve(mockProducts[productIndex]);
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:recycle', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].endOfLifeStatus = 'Recycled';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:resolve');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].verificationStatus = 'Not Submitted';
  mockProducts[productIndex].status = 'Draft';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
}

export async function suggestImprovements(input: {
  productName: string;
  productDescription: string;
}) {
  return await suggestImprovementsFlow(input);
}


export async function addServiceRecord(
  productId: string,
  notes: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:add_service_record');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');

  const product = mockProducts[productIndex];

  const now = new Date().toISOString();
  const newRecord: ServiceRecord = {
    id: newId('serv'),
    providerId: user.id,
    providerName: user.fullName,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  if (!product.serviceHistory) {
    product.serviceHistory = [];
  }
  product.serviceHistory.push(newRecord);
  product.lastUpdated = now;

  mockProducts[productIndex] = product;

  await logAuditEvent('product.serviced', productId, { notes }, userId);

  return Promise.resolve(product);
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

export async function analyzeBillOfMaterials(bomText: string) {
  return await analyzeBillOfMaterialsFlow({ bomText });
}


export async function bulkCreateProducts(
  productsToImport: any[],
  userId: string,
): Promise<{ createdCount: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('Company not found');

  const createdCount = productsToImport.length;
  productsToImport.forEach(p => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: newId('pp'),
      ...p,
      companyId: user.companyId,
      supplier: company.name,
      status: 'Draft',
      verificationStatus: 'Not Submitted',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      isProcessing: true,
      materials: p.materials || [],
      endOfLifeStatus: 'Active',
    };
    mockProducts.unshift(newProduct);
  });

  await logAuditEvent(
    'product.bulk_import',
    user.companyId,
    { count: createdCount },
    userId,
  );

  return Promise.resolve({ createdCount });
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
