// src/lib/actions.ts
'use server';

import type {
  Product,
  ComplianceGap,
  Company,
  AuditLog,
  User,
  ApiKey,
  ApiSettings,
  CompliancePath,
  ServiceTicket,
  ProductionLine,
  Webhook,
  SupportTicket,
  ServiceRecord,
} from './types';
import {
  productFormSchema,
  type ProductFormValues,
  userFormSchema,
  UserFormValues,
  companyFormSchema,
  CompanyFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
  apiSettingsSchema,
  ApiSettingsFormValues,
  serviceTicketFormSchema,
  ServiceTicketFormValues,
  webhookFormSchema,
  WebhookFormValues,
  productionLineFormSchema,
  ProductionLineFormValues,
  apiKeyFormSchema,
  ApiKeyFormValues,
  bulkProductImportSchema,
  onboardingFormSchema,
  OnboardingFormValues,
  supportTicketFormSchema,
  SupportTicketFormValues,
} from './schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { UserRoles, type Role } from './constants';
import {
  getUserById,
  getCompanyById,
  getUsersByCompanyId,
  getUserByEmail as authGetUserByEmail,
  getCompanies,
  getUsers,
} from './auth';
import { hasRole } from './auth-utils';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct } from './ai/schemas';
import { checkPermission, PermissionError } from './permissions';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';

// MOCK DATA IMPORTS
import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { productionLines as mockProductionLines } from './manufacturing-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { webhooks as mockWebhooks } from './webhook-data';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { runDataValidationCheck as processProductAi } from '@/triggers/on-product-change';

// Helper for mock data manipulation
const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// --- WEBHOOK ACTIONS ---

export async function getWebhooks(userId?: string): Promise<Webhook[]> {
  if (userId) {
    const user = await getUserById(userId);
    if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
    return Promise.resolve(mockWebhooks.filter(w => w.userId === userId));
  }
  return Promise.resolve(mockWebhooks);
}

export async function getWebhookById(
  id: string,
  userId: string,
): Promise<Webhook | undefined> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return undefined;

  const webhook = mockWebhooks.find(w => w.id === id);
  return Promise.resolve(webhook?.userId === userId ? webhook : undefined);
}

export async function saveWebhook(
  values: WebhookFormValues,
  userId: string,
  webhookId?: string,
): Promise<Webhook> {
  const validatedData = webhookFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const now = new Date().toISOString();
  let savedWebhook: Webhook;

  if (webhookId) {
    const webhookIndex = mockWebhooks.findIndex(wh => wh.id === webhookId);
    if (webhookIndex === -1) throw new Error('Webhook not found.');
    savedWebhook = {
      ...mockWebhooks[webhookIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockWebhooks[webhookIndex] = savedWebhook;
    await logAuditEvent(
      'webhook.updated',
      webhookId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    savedWebhook = {
      id: newId('wh'),
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    mockWebhooks.push(savedWebhook);
    await logAuditEvent(
      'webhook.created',
      savedWebhook.id,
      { url: validatedData.url },
      userId,
    );
  }
  return Promise.resolve(savedWebhook);
}

export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const index = mockWebhooks.findIndex(
    wh => wh.id === webhookId && wh.userId === userId,
  );
  if (index > -1) {
    mockWebhooks.splice(index, 1);
    await logAuditEvent('webhook.deleted', webhookId, {}, userId);
  }
  return Promise.resolve();
}

export async function replayWebhook(
  logId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const log = await getAuditLogById(logId);
  if (!log || !log.action.includes('webhook.delivery.failure')) {
    throw new Error('Log not found or not a failed delivery.');
  }

  const webhook = await getWebhookById(log.entityId, user.id);
  const product = await getProductById(log.details.productId, user.id);

  if (!webhook || !product) {
    throw new Error('Could not find original webhook or product for replay.');
  }

  // Intentionally not awaiting to avoid blocking the user action
  sendWebhook(webhook, log.details.event, product);

  await logAuditEvent(
    'webhook.replay.initiated',
    log.entityId,
    { originalLogId: logId },
    userId,
  );
}

// --- PRODUCT ACTIONS ---

export async function getProducts(
  userId?: string,
  filters?: { searchQuery?: string },
): Promise<Product[]> {
  let user: User | undefined;
  if (userId) {
    user = await getUserById(userId);
    if (!user) return [];
  }

  let results = [...mockProducts];

  // Apply search filter if provided
  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(query) ||
        p.supplier.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.gtin?.toLowerCase().includes(query),
    );
  }

  if (!userId) {
    // Public access: only published products
    return Promise.resolve(results.filter(p => p.status === 'Published'));
  }

  // Authenticated access
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
  const hasGlobalRead = globalReadRoles.some(role => hasRole(user!, role));

  if (hasGlobalRead) {
    return Promise.resolve(
      results.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      ),
    );
  }

  // Company-specific access
  return Promise.resolve(
    results
      .filter(p => p.companyId === user!.companyId)
      .sort(
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
  if (!product) return undefined;

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

  const hasGlobalReadAccess = globalReadRoles.some(role =>
    hasRole(user, role),
  );

  if (hasGlobalReadAccess || user.companyId === product.companyId) {
    return product;
  }

  return product.status === 'Published' ? product : undefined;
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

  // Simulate AI processing delay
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

  // Set processing to true immediately for optimistic UI update
  mockProducts[productIndex].isProcessing = true;
  mockProducts[productIndex].lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'product.recalculate_score.started',
    productId,
    {},
    userId,
  );
  console.log(`Product ${productId} marked for score recalculation.`);

  // Simulate AI processing in the background
  setTimeout(async () => {
    try {
      const productToProcess = mockProducts[productIndex];
      if (productToProcess) {
        console.log(`AI processing started for ${product.id}`);
        const { sustainability, qrLabelText, dataQualityWarnings } =
          await processProductAi(productToProcess);

        // Find the index again in case the array has changed
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
        mockProducts[currentIndex].lastUpdated = new Date().toISOString();
      }
      await logAuditEvent(
        'product.recalculate_score.failed',
        productId,
        { error: (error as Error).message },
        userId,
      );
    }
  }, 3000); // 3 second delay to simulate processing

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
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const complianceResult = await summarizeComplianceGaps({
    product: aiProductInput,
    compliancePath: compliancePath,
  });

  const currentSustainability = mockProducts[productIndex].sustainability;

  const updatedProduct = {
    ...mockProducts[productIndex],
    sustainability: {
      ...currentSustainability!,
      isCompliant: complianceResult.isCompliant,
      complianceSummary: complianceResult.complianceSummary,
      gaps: complianceResult.gaps,
    },
    lastUpdated: new Date().toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'product.compliance.checked',
    productId,
    { result: complianceResult },
    userId,
  );
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

  // Update product in mock data
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
  if (productIndex === -1) throw new Error('Product not found');

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
  return await suggestImprovementsFlow({
    product: {
      productName: input.productName,
      productDescription: input.productDescription,
      category: 'unknown',
      supplier: 'unknown',
      materials: [],
    },
  });
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
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:edit');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found');

  const declaration = await generateConformityDeclarationText(productId, userId);
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].declarationOfConformity = declaration;

  return;
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

  await logAuditEvent('doc.generated', productId, {}, userId);
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

// Helper function to recursively flatten a nested object for CSV export.
const flattenObject = (
  obj: any,
  parentKey = '',
  res: Record<string, any> = {},
) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parentKey ? `${parentKey}_${key}` : key;
      const value = obj[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        flattenObject(value, propName, res);
      } else if (Array.isArray(value)) {
        // Stringify arrays of objects for CSV.
        res[propName] = JSON.stringify(value);
      } else {
        res[propName] = value;
      }
    }
  }
  return res;
};

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }

  // Handle CSV conversion
  if (products.length === 0) {
    return '';
  }

  const flatProducts = products.map(flattenObject);

  // Get a comprehensive list of all possible headers from all products
  const allHeaders = Array.from(
    flatProducts.reduce((acc, product) => {
      Object.keys(product).forEach(key => acc.add(key));
      return acc;
    }, new Set<string>()),
  ).sort();

  const csvRows = [allHeaders.join(',')];

  for (const product of flatProducts) {
    const values = allHeaders.map(header => {
      const value = product[header];

      if (value === undefined || value === null) {
        return '';
      }

      let stringValue =
        typeof value === 'object' ? JSON.stringify(value) : String(value);

      // Escape quotes by doubling them and wrap the whole string in quotes if it contains commas, quotes, or newlines.
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function exportComplianceReport(format: 'csv'): Promise<string> {
  const products = await getProducts();
  if (format !== 'csv') {
    throw new Error('Unsupported format for compliance report.');
  }

  if (products.length === 0) {
    return '';
  }

  const complianceData = products.map(p => ({
    productId: p.id,
    productName: p.productName,
    supplier: p.supplier,
    verificationStatus: p.verificationStatus,
    isCompliant: p.sustainability?.isCompliant,
    complianceSummary: p.sustainability?.complianceSummary,
    gaps: p.sustainability?.gaps ? JSON.stringify(p.sustainability.gaps) : '[]',
  }));

  const headers = Object.keys(complianceData[0]).join(',');
  const csvRows = [headers];

  for (const item of complianceData) {
    const values = Object.values(item).map(value => {
      if (value === undefined || value === null) {
        return '';
      }
      let stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');

  const now = new Date().toISOString();
  let savedCompany: Company;

  if (companyId) {
    const companyIndex = mockCompanies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) throw new Error('Company not found');
    savedCompany = {
      ...mockCompanies[companyIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockCompanies[companyIndex] = savedCompany;
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    savedCompany = {
      id: newId('comp'),
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    };
    mockCompanies.push(savedCompany);
    await logAuditEvent('company.created', savedCompany.id, {}, userId);
  }
  return Promise.resolve(savedCompany);
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');

  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index > -1) {
    mockCompanies.splice(index, 1);
    await logAuditEvent('company.deleted', companyId, {}, userId);
  }
  return Promise.resolve();
}

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const now = new Date().toISOString();
  let savedUser: User;

  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    savedUser = {
      ...mockUsers[userIndex],
      ...userData,
      onboardingComplete: mockUsers[userIndex].onboardingComplete,
      isMfaEnabled: mockUsers[userIndex].isMfaEnabled,
      readNotificationIds: mockUsers[userIndex].readNotificationIds,
      createdAt: mockUsers[userIndex].createdAt,
    };
    mockUsers[userIndex] = savedUser;
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    savedUser = {
      id: newId('user'),
      ...userData,
      createdAt: now,
      onboardingComplete: true, // New users created by admin are considered onboarded
      isMfaEnabled: false,
      readNotificationIds: [],
    };
    mockUsers.push(savedUser);
    await logAuditEvent('user.created', savedUser.id, {}, adminId);
  }
  return Promise.resolve(savedUser);
}

export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, {}, adminId);
  }
  return Promise.resolve();
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return Promise.resolve(mockCompliancePaths);
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  return Promise.resolve(mockCompliancePaths.find(p => p.id === id));
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  const validatedData = compliancePathFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedPath: CompliancePath;

  const pathData = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations.map(item => item.value).filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords?.map(item => item.value).filter(Boolean),
      bannedKeywords: validatedData.bannedKeywords?.map(item => item.value).filter(Boolean),
    },
    updatedAt: now,
  };

  if (pathId) {
    const pathIndex = mockCompliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Path not found');
    savedPath = {
      ...mockCompliancePaths[pathIndex],
      ...pathData,
      createdAt: mockCompliancePaths[pathIndex].createdAt,
      id: pathId,
    };
    mockCompliancePaths[pathIndex] = savedPath;
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    savedPath = { id: newId('cp'), ...pathData, createdAt: now };
    mockCompliancePaths.push(savedPath);
    await logAuditEvent('compliance_path.created', savedPath.id, {}, userId);
  }
  return Promise.resolve(savedPath);
}

export async function deleteCompliancePath(
  pathId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  const index = mockCompliancePaths.findIndex(p => p.id === pathId);
  if (index > -1) {
    mockCompliancePaths.splice(index, 1);
    await logAuditEvent('compliance_path.deleted', pathId, {}, userId);
  }
  return Promise.resolve();
}

export async function getAuditLogs(filters?: {
  companyId?: string;
  entityId?: string;
  userId?: string;
}): Promise<AuditLog[]> {
  let logs = [...mockAuditLogs];

  if (filters?.entityId) {
    logs = logs.filter(log => log.entityId === filters.entityId);
  }
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  if (filters?.companyId) {
    const companyUsers = await getUsersByCompanyId(filters.companyId);
    const userIds = new Set(companyUsers.map(u => u.id));
    logs = logs.filter(log => userIds.has(log.userId));
  }

  return Promise.resolve(
    logs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return getAuditLogs({ userId });
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  return getAuditLogs({ entityId });
}

export async function getAuditLogById(
  id: string,
): Promise<AuditLog | undefined> {
  return Promise.resolve(mockAuditLogs.find(log => log.id === id));
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: newId('log'),
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  mockAuditLogs.unshift(log); // Add to beginning
  return Promise.resolve(log);
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
  return Promise.resolve(mockApiKeys.filter(k => k.userId === userId));
}

export async function saveApiKey(
  values: ApiKeyFormValues,
  userId: string,
  keyId?: string,
): Promise<{ key: ApiKey; rawToken?: string }> {
  const validatedData = apiKeyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const now = new Date().toISOString();
  let savedKey: ApiKey;
  let rawToken: string | undefined = undefined;

  if (keyId) {
    // Update existing key
    const keyIndex = mockApiKeys.findIndex(
      k => k.id === keyId && k.userId === userId,
    );
    if (keyIndex === -1) throw new Error('API Key not found');
    savedKey = {
      ...mockApiKeys[keyIndex],
      label: validatedData.label,
      scopes: validatedData.scopes,
      updatedAt: now,
    };
    mockApiKeys[keyIndex] = savedKey;
    await logAuditEvent(
      'api_key.updated',
      keyId,
      { changes: ['label', 'scopes'] },
      userId,
    );
    return { key: savedKey };
  } else {
    // Create new key
    rawToken = `nor_mock_${[...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    savedKey = {
      id: newId('key'),
      label: validatedData.label,
      scopes: validatedData.scopes,
      token: `nor_mock_******************${rawToken.slice(-4)}`,
      status: 'Active',
      userId,
      createdAt: now,
      updatedAt: now,
      lastUsed: undefined,
    };
    mockApiKeys.push(savedKey);
    await logAuditEvent(
      'api_key.created',
      savedKey.id,
      { label: savedKey.label },
      userId,
    );
    return { key: savedKey, rawToken };
  }
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const keyIndex = mockApiKeys.findIndex(
    k => k.id === keyId && k.userId === userId,
  );
  if (keyIndex === -1)
    throw new Error('API Key not found or permission denied.');
  mockApiKeys[keyIndex].status = 'Revoked';
  mockApiKeys[keyIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  return Promise.resolve(mockApiKeys[keyIndex]);
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const index = mockApiKeys.findIndex(
    k => k.id === keyId && k.userId === userId,
  );
  if (index > -1) {
    mockApiKeys.splice(index, 1);
    await logAuditEvent('api_key.deleted', keyId, {}, userId);
  }
  return Promise.resolve();
}

export async function getApiSettings(): Promise<ApiSettings> {
  return Promise.resolve(mockApiSettings);
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');
  
  const validatedData = apiSettingsSchema.parse(values);
  Object.assign(mockApiSettings, validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return Promise.resolve(mockApiSettings);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  user.readNotificationIds = mockAuditLogs.map(log => log.id);
  return Promise.resolve();
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = new Date().toISOString();
  const newCompany: Company = {
    id: newId('comp'),
    name: `${name}'s Company`,
    ownerId: userId,
    industry: '',
    createdAt: now,
    updatedAt: now,
  };
  mockCompanies.push(newCompany);

  const newUser: User = {
    id: userId,
    fullName: name,
    email: email,
    companyId: newCompany.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false,
    isMfaEnabled: false,
    readNotificationIds: [],
  };
  mockUsers.push(newUser);
  return Promise.resolve();
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  userId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');

  const companyIndex = mockCompanies.findIndex(
    c => c.id === mockUsers[userIndex].companyId,
  );
  if (companyIndex === -1) throw new Error('Company not found');

  mockUsers[userIndex].onboardingComplete = true;
  mockUsers[userIndex].updatedAt = new Date().toISOString();

  mockCompanies[companyIndex].name = values.companyName;
  mockCompanies[companyIndex].industry = values.industry;
  mockCompanies[companyIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'user.onboarded',
    userId,
    { companyId: mockUsers[userIndex].companyId },
    userId,
  );
  return Promise.resolve();
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].fullName = fullName;
    mockUsers[userIndex].updatedAt = new Date().toISOString();
    await logAuditEvent(
      'user.profile.updated',
      userId,
      { fields: ['fullName'] },
      actorId,
    );
  }
  return Promise.resolve();
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
  actorId: string,
) {
  if (current !== 'password123')
    throw new Error('Incorrect current password.');
  console.log(
    `Password for user ${userId} has been updated in mock environment.`,
  );
  await logAuditEvent('user.password.updated', userId, {}, actorId);
  return Promise.resolve();
}

export async function setMfaStatus(
  userId: string,
  enabled: boolean,
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].isMfaEnabled = enabled;
    await logAuditEvent('user.mfa.updated', userId, { enabled }, actorId);
  }
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  actorId: string,
) {
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent('user.notifications.updated', userId, { prefs }, actorId);
  return Promise.resolve();
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return Promise.resolve(mockServiceTickets);
}

export async function saveSupportTicket(
  values: SupportTicketFormValues,
  userId?: string,
): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: newId('spt'),
    ...values,
    userId,
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };
  // In a real app, this would be saved to a database.
  console.log('New support ticket created (mock):', newTicket);
  await logAuditEvent('support_ticket.created', newTicket.id, {}, userId || 'guest');
  return newTicket;
}

export async function saveServiceTicket(
  values: ServiceTicketFormValues,
  userId: string,
  ticketId?: string,
): Promise<ServiceTicket> {
  const validatedData = serviceTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedTicket: ServiceTicket;

  if (ticketId) {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) throw new Error('Ticket not found');
    savedTicket = {
      ...mockServiceTickets[ticketIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockServiceTickets[ticketIndex] = savedTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = {
      id: newId('tkt'),
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    mockServiceTickets.unshift(savedTicket);
    await logAuditEvent('ticket.created', savedTicket.id, {}, userId);
  }
  return Promise.resolve(savedTicket);
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) throw new Error('Ticket not found');
  mockServiceTickets[ticketIndex].status = status;
  mockServiceTickets[ticketIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  return Promise.resolve(mockServiceTickets[ticketIndex]);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return Promise.resolve(mockProductionLines);
}

export async function saveProductionLine(
  values: ProductionLineFormValues,
  userId: string,
  lineId?: string,
): Promise<ProductionLine> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'manufacturer:manage_lines');

  const validatedData = productionLineFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedLine: ProductionLine;

  const lineData = {
    ...validatedData,
    outputPerHour: Number(validatedData.outputPerHour),
    updatedAt: now,
  };

  if (lineId) {
    const lineIndex = mockProductionLines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) throw new Error('Line not found');
    savedLine = {
      ...mockProductionLines[lineIndex],
      ...lineData,
    };
    mockProductionLines[lineIndex] = savedLine;
    await logAuditEvent('production_line.updated', lineId, {}, userId);
  } else {
    savedLine = {
      id: newId('line'),
      ...lineData,
      lastMaintenance: now,
      createdAt: now,
    };
    mockProductionLines.push(savedLine);
    await logAuditEvent('production_line.created', savedLine.id, {}, userId);
  }
  return Promise.resolve(savedLine);
}

export async function deleteProductionLine(
  lineId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'manufacturer:manage_lines');

  const index = mockProductionLines.findIndex(l => l.id === lineId);
  if (index > -1) {
    mockProductionLines.splice(index, 1);
    await logAuditEvent('production_line.deleted', lineId, {}, userId);
  }
  return Promise.resolve();
}

export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  return authGetUserByEmail(email);
}

export async function globalSearch(
  query: string,
  userId: string,
): Promise<{
  products: Product[];
  users: User[];
  compliancePaths: CompliancePath[];
}> {
  const user = await getUserById(userId);
  if (!user) return { products: [], users: [], compliancePaths: [] };

  const lowerCaseQuery = query.toLowerCase();

  const products = await getProducts(userId, { searchQuery: query });

  let users: User[] = [];
  let compliancePaths: CompliancePath[] = [];

  if (hasRole(user, UserRoles.ADMIN)) {
    const allUsers = await getUsers();
    users = allUsers.filter(
      u =>
        u.fullName.toLowerCase().includes(lowerCaseQuery) ||
        u.email.toLowerCase().includes(lowerCaseQuery),
    );

    const allPaths = await getCompliancePaths();
    compliancePaths = allPaths.filter(p =>
      p.name.toLowerCase().includes(lowerCaseQuery),
    );
  }

  return {
    products: products.slice(0, 5),
    users: users.slice(0, 5),
    compliancePaths: compliancePaths.slice(0, 5),
  };
}
