// src/lib/actions/product-actions.ts
'use server';

import type {
  Product,
  User,
  SustainabilityData,
  ComplianceGap,
  ServiceRecord,
  CustomsStatus,
  BlockchainProof,
  ZkProof,
} from '@/types';
import {
  productFormSchema,
  type ProductFormValues,
  customsInspectionFormSchema,
  type CustomsInspectionFormValues,
} from '@/lib/schemas';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { UserRoles, type Role } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import {
  runSubmissionValidation,
  isChecklistComplete,
} from '@/services/validation';
import { products as mockProducts } from '@/lib/data';
import { users as mockUsers } from '@/lib/user-data';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import { validateProductData } from '@/ai/flows/validate-product-data';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import type { AiProduct, DataQualityWarning } from '@/types/ai-outputs';
import { getCompliancePathById } from './compliance-actions';
import { sendWebhook } from '@/services/webhooks';
import { hashData, anchorToPolygon } from '@/services/blockchain';
import { createVerifiableCredential } from '@/services/credential';
import { generateComplianceProof } from '@/services/zkp-service';
import { getWebhooks } from './webhook-actions';
import { getApiSettings } from './settings-actions';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage as generateProductImageFlow } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { productQa } from '@/ai/flows/product-qa-flow';
import type { ProductQuestionOutput } from '@/ai/flows/product-qa-flow';
import { generateProductDescription as generateProductDescriptionFlow } from '@/ai/flows/generate-product-description';
import { generatePcds as generatePcdsFlow } from '@/ai/flows/generate-pcds';
import type { PcdsOutput } from '@/types/ai-outputs';
import { predictProductLifecycle as predictProductLifecycleFlow } from '@/ai/flows/predict-product-lifecycle';
import { explainError as explainErrorFlow } from '@/ai/flows/explain-error';
import { analyzeTextileComposition } from '@/ai/flows/analyze-textile-composition';

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

// --- Core CRUD Actions ---

export async function getProducts(
  userId?: string,
  filters?: {
    searchQuery?: string;
    category?: string;
    verificationStatus?: string;
  },
): Promise<Product[]> {
  let user: User | undefined;
  if (userId) {
    user = await getUserById(userId);
    if (!user) return [];
  }

  let results: Product[] = [...mockProducts];

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.RETAILER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RECYCLER,
  ];

  if (!userId) {
    results = results.filter(p => p.status === 'Published');
  } else if (!globalReadRoles.some(role => hasRole(user!, role))) {
    results = results.filter(p => p.companyId === user!.companyId);
  }

  // In-memory filtering after fetching
  if (filters?.searchQuery) {
    const s = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(s) ||
        p.supplier.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.gtin?.toLowerCase().includes(s),
    );
  }
  if (filters?.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters?.verificationStatus) {
    results = results.filter(
      p =>
        (p.verificationStatus ?? 'Not Submitted') === filters.verificationStatus,
    );
  }

  return Promise.resolve(
    results.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    ),
  );
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (!product) {
    return undefined;
  }

  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }

  const user = await getUserById(userId);
  if (!user) return undefined;

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RETAILER,
  ];

  const hasGlobalReadAccess = globalReadRoles.some(role => hasRole(user, role));

  if (hasGlobalReadAccess || user.companyId === product.companyId) {
    return product;
  }

  return product.status === 'Published' ? product : undefined;
}

export async function getProductByGtin(
  gtin: string,
  userId: string,
): Promise<Product | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;

  let results = [...mockProducts].filter(p => p.gtin === gtin);

  if (!hasRole(user, UserRoles.ADMIN) && !hasRole(user, UserRoles.DEVELOPER)) {
    results = results.filter(p => p.companyId === user.companyId);
  }

  return Promise.resolve(results[0]);
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
  let productIndex = -1;

  if (productId) {
    productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found');
    const existingProduct = mockProducts[productIndex];

    checkPermission(user, 'product:edit', existingProduct);

    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    const updatedData: Partial<Product> = {
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
      status:
        existingProduct.verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
      isProcessing: true,
    };

    savedProduct = { ...existingProduct, ...updatedData, id: productId };
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

    const newProductData: Omit<Product, 'id'> = {
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
      submissionChecklist: {
        hasBaseInfo: false,
        hasMaterials: false,
        hasManufacturing: false,
        hasLifecycleData: false,
        hasCompliancePath: false,
        passesDataQuality: true,
      },
    };
    const id = newId('pp');
    savedProduct = { id, ...newProductData };
    mockProducts.unshift(savedProduct);
    productIndex = 0;

    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  const checklist = await runSubmissionValidation(savedProduct);
  if (productIndex !== -1) {
    mockProducts[productIndex].submissionChecklist = checklist;
  }

  // Simulate background AI processing
  setTimeout(async () => {
    try {
      const currentProductState = mockProducts.find(
        p => p.id === savedProduct.id,
      );
      if (!currentProductState) return;
      const { sustainability, qrLabelText, dataQualityWarnings } =
        await processProductAi(currentProductState);

      const finalChecklist = await runSubmissionValidation({
        ...currentProductState,
        dataQualityWarnings,
      });

      const finalProductIndex = mockProducts.findIndex(
        p => p.id === savedProduct.id,
      );
      if (finalProductIndex !== -1) {
        mockProducts[finalProductIndex] = {
          ...mockProducts[finalProductIndex],
          sustainability,
          qrLabelText,
          dataQualityWarnings,
          submissionChecklist: finalChecklist,
          isProcessing: false,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error(
        `Background AI processing failed for product ${savedProduct.id}`,
        e,
      );
      const finalProductIndex = mockProducts.findIndex(
        p => p.id === savedProduct.id,
      );
      if (finalProductIndex !== -1) {
        mockProducts[finalProductIndex].isProcessing = false;
      }
    }
  }, 3000);

  return savedProduct;
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
  }

  await logAuditEvent('product.deleted', productId, {}, userId);
}

// --- Workflow Actions ---

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:submit', product);

  const checklist = await runSubmissionValidation(product);
  if (!(await isChecklistComplete(checklist))) {
    throw new Error(
      'Submission checklist is not complete. Please fill in all required fields.',
    );
  }

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].verificationStatus = 'Pending';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);

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

  // Fetch the company to pass to the credential service for revocation info
  const company = await getCompanyById(product.companyId);
  if (!company)
    throw new Error('Company associated with product not found.');

  // 1. Create the full Verifiable Credential first.
  const verifiableCredential = await createVerifiableCredential(
    product,
    company,
  );

  // 2. Hash the claims (credentialSubject) to get the Merkle root for anchoring.
  const dataHash = await hashData(verifiableCredential.credentialSubject);

  // 3. Anchor this hash on the blockchain.
  const anchorResult = await anchorToPolygon(dataHash);

  const blockchainProof: BlockchainProof = {
    type: 'SINGLE_HASH',
    ...anchorResult,
    merkleRoot: dataHash,
  };

  const updatedProduct = {
    ...product,
    verificationStatus: 'Verified' as const,
    status: 'Published' as const,
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    verifiableCredential: JSON.stringify(verifiableCredential, null, 2),
    ebsiVcId: verifiableCredential.id,
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash, vcId: verifiableCredential.id },
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
    const apiSettings = await getApiSettings();
    for (const webhook of subscribedWebhooks) {
      sendWebhook(webhook, 'product.published', updatedProduct, apiSettings);
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

  const currentSustainability = mockProducts[productIndex].sustainability || {
    score: 0,
    environmental: 0,
    social: 0,
    governance: 0,
    isCompliant: false,
    summary: '',
    complianceSummary: '',
  };

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    sustainability: {
      ...currentSustainability,
      complianceSummary: reason,
      gaps,
    },
  };

  await logAuditEvent('passport.rejected', productId, { reason, gaps }, userId);
  return Promise.resolve(mockProducts[productIndex]);
}

export async function overrideVerification(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:override_verification');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const now = new Date().toISOString();

  const overrideDetails = {
    reason,
    userId,
    date: now,
  };

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    verificationStatus: 'Verified',
    status: 'Published',
    lastUpdated: now,
    lastVerificationDate: now,
    verificationOverride: overrideDetails,
  };

  await logAuditEvent(
    'product.verification.overridden',
    productId,
    { reason },
    userId,
  );

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

  // Grant circularity credits
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const creditsToGrant = 10;
    mockUsers[userIndex].circularityCredits =
      (mockUsers[userIndex].circularityCredits || 0) + creditsToGrant;
    await logAuditEvent(
      'credits.minted',
      productId,
      {
        amount: creditsToGrant,
        newBalance: mockUsers[userIndex].circularityCredits,
        recipient: userId,
      },
      'system',
    );
  }

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

export async function performCustomsInspection(
  productId: string,
  values: CustomsInspectionFormValues,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:customs_inspect');

  const validatedData = customsInspectionFormSchema.parse(values);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');
  const product = mockProducts[productIndex];

  const now = new Date().toISOString();
  const newCustomsEvent: Omit<CustomsStatus, 'history'> = {
    ...validatedData,
    date: now,
  };

  const currentHistory = product.customs?.history || [];
  if (product.customs && product.customs.date) {
    // Add the previous 'latest' event to the history log.
    const previousEvent = { ...product.customs, history: undefined };
    currentHistory.push(previousEvent);
  }

  // Set the new event as the latest status
  product.customs = { ...newCustomsEvent, history: currentHistory };
  product.lastUpdated = now;

  // Update transit stage based on customs status
  if (product.transit) {
    switch (validatedData.status) {
      case 'Cleared':
        product.transit.stage = `Cleared - Inland Transit (${validatedData.location})`;
        break;
      case 'Detained':
        product.transit.stage = `Detained at Customs (${validatedData.location})`;
        break;
      case 'Rejected':
        product.transit.stage = `Shipment Rejected at (${validatedData.location})`;
        break;
    }
  }

  mockProducts[productIndex] = product;

  await logAuditEvent(
    'customs.inspected',
    productId,
    { ...newCustomsEvent },
    userId,
  );

  return Promise.resolve(mockProducts[productIndex]);
}

export async function generateZkProofForProduct(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:generate_zkp', product);

  await logAuditEvent('zkp.generation.started', productId, {}, userId);

  const proof = await generateComplianceProof(product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].zkProof = proof;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'zkp.generation.success',
    productId,
    { proofData: proof.proofData.substring(0, 20) + '...' }, // log a snippet
    userId,
  );

  return Promise.resolve(mockProducts[productIndex]);
}

// --- Bulk Actions ---

export async function bulkDeleteProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const deletedIds: string[] = [];
  for (const productId of productIds) {
    const product = await getProductById(productId, user.id);
    if (!product) continue;

    try {
      checkPermission(user, 'product:delete', product);
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index > -1) {
        mockProducts.splice(index, 1);
        deletedIds.push(productId);
      }
    } catch (error) {
      console.warn(
        `Could not delete product ${productId}: ${(error as Error).message}`,
      );
    }
  }

  if (deletedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_delete',
      'multiple',
      { count: deletedIds.length, productIds: deletedIds },
      userId,
    );
  }
}

export async function bulkSubmitForReview(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const submittedIds: string[] = [];
  for (const productId of productIds) {
    try {
      await submitForReview(productId, userId);
      submittedIds.push(productId);
    } catch (error) {
      console.warn(
        `Could not submit product ${productId} for review: ${
          (error as Error).message
        }`,
      );
    }
  }

  if (submittedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_submit',
      'multiple',
      { count: submittedIds.length, productIds: submittedIds },
      userId,
    );
  }
}

export async function bulkCreateProducts(
  productsToImport: any[],
  userId: string,
): Promise<{ createdCount: number }> {
  // This function is complex and would require the full saveProduct logic,
  // including company creation, etc. For this mock, we will just log it.
  // The actual implementation is in user-actions.ts for user import.
  const createdCount = productsToImport.length;
  await logAuditEvent(
    'product.bulk_import',
    'multiple',
    { count: createdCount },
    userId,
  );
  return Promise.resolve({ createdCount });
}

export async function bulkArchiveProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const archivedIds: string[] = [];
  for (const productId of productIds) {
    const product = await getProductById(productId, userId);
    if (!product) continue;

    try {
      checkPermission(user, 'product:archive', product);
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index > -1) {
        mockProducts[index].status = 'Archived';
        mockProducts[index].lastUpdated = new Date().toISOString();
        archivedIds.push(productId);
      }
    } catch (error) {
      console.warn(
        `Could not archive product ${productId}: ${(error as Error).message}`,
      );
    }
  }

  if (archivedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_archive',
      'multiple',
      { count: archivedIds.length, productIds: archivedIds },
      userId,
    );
  }
}

// --- AI-driven Actions (from old product-ai-actions) ---
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
  console.log(
    `Manual recalculation trigger for ${productId}. Processing is handled on save.`,
  );

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

  await logAuditEvent(
    'product.validation.manual_trigger',
    productId,
    {},
    userId,
  );
  console.log(
    `Manual data validation trigger for ${productId}. Processing is handled on save.`,
  );
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

  if (
    !product.textile ||
    !product.textile.fiberComposition ||
    product.textile.fiberComposition.length === 0
  ) {
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
