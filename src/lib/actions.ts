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
} from './auth';
import { hasRole } from './auth-utils';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct } from './ai/schemas';
import { checkPermission, PermissionError } from './permissions';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';
import { validateProductData } from '@/ai/flows/validate-product-data';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { webhooks as mockWebhooks } from './webhook-data';

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
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.RETAILER,
  ];
  const hasGlobalRead = globalReadRoles.some(role => hasRole(user!, role));

  if (hasGlobalRead) {
    return Promise.resolve(results);
  }

  // Company-specific access
  return Promise.resolve(results.filter(p => p.companyId === user!.companyId));
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
  if (productIndex === -1) throw new Error('Product not found');

  // Set the processing flag and sentinel value to trigger the cloud function
  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    isProcessing: true,
    sustainability: {
      ...(mockProducts[productIndex].sustainability as any),
      score: -1, // Sentinel value to trigger re-calculation
    },
  };

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  console.log(`Product ${productId} marked for score recalculation.`);
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

  // --- NEW WEBHOOK LOGIC ---
  const allWebhooks = await getWebhooks();
  const subscribedWebhooks = allWebhooks.filter(
    wh => wh.status === 'active' && wh.events.includes('product.published'),
  );

  if (subscribedWebhooks.length > 0) {
    console.log(
      `Found ${subscribedWebhooks.length} webhook(s) for product.published event.`,
    );
    for (const webhook of subscribedWebhooks) {
      // Intentionally not awaiting this to avoid blocking the main action
      sendWebhook(webhook, 'product.published', updatedProduct);
    }
  }
  // --- END NEW WEBHOOK LOGIC ---

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
  return await suggestImprovementsFlow({ product: { ...input } as any });
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

export async function addServiceRecord(
  productId: string,
  notes: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:add_service_record');

  const now = new Date().toISOString();
  const newRecord: ServiceRecord = {
    id: newId('srv'),
    providerName: user.fullName,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  const updatedProduct = {
    ...mockProducts[productIndex],
    serviceHistory: [
      ...(mockProducts[productIndex].serviceHistory || []),
      newRecord,
    ],
    lastUpdated: now,
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent('product.serviced', productId, { notes }, userId);

  return Promise.resolve(updatedProduct);
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  return Promise.resolve(mockCompanies);
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  // This is a placeholder since the data file is gone.
  // In a real app, this would fetch from Firestore.
  return Promise.resolve([]);
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const paths = await getCompliancePaths();
  return Promise.resolve(paths.find(p => p.id === id));
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
    savedUser = { ...mockUsers[userIndex], ...userData };
    mockUsers[userIndex] = savedUser;
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    savedUser = {
      id: newId('user'),
      ...userData,
      createdAt: now,
      readNotificationIds: [],
      onboardingComplete: true, // Assuming admin-created users are pre-onboarded
      isMfaEnabled: false,
    };
    mockUsers.push(savedUser);
    await logAuditEvent('user.created', savedUser.id, {}, adminId);
  }
  return Promise.resolve(savedUser);
}

export async function deleteUser(userId: string, adminId: string): Promise<void> {
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

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  // This function is now a placeholder as data is stored in Firestore
  console.log('Mock saveCompliancePath called:', { values, userId, pathId });
  const now = new Date().toISOString();
  const savedPath = {
    id: pathId || newId('cp'),
    name: values.name,
    description: values.description,
    category: values.category,
    regulations: [], // Placeholder
    rules: {}, // Placeholder
    createdAt: now,
    updatedAt: now,
  };
  return Promise.resolve(savedPath as CompliancePath);
}

export async function deleteCompliancePath(
  pathId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');
  console.log('Mock deleteCompliancePath called for:', pathId);
  return Promise.resolve();
}

export async function getAuditLogs(filters?: {
  companyId?: string;
}): Promise<AuditLog[]> {
  let logs = [...mockAuditLogs];

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
  return Promise.resolve(
    mockAuditLogs
      .filter(log => log.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  );
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  return Promise.resolve(
    mockAuditLogs
      .filter(log => log.entityId === entityId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  );
}

export async function getAuditLogById(id: string): Promise<AuditLog | undefined> {
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
  if (!user) throw new Error('Permission denied.');
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
  if (!user) {
    throw new PermissionError('You do not have permission to revoke API keys.');
  }
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
  if (!user) {
    throw new PermissionError('You do not have permission to delete API keys.');
  }
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
  if (!user) throw new Error('Permission denied');
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
  if (userIndex === -1) throw new Error('User not found for onboarding');
  const user = mockUsers[userIndex];

  // Instead of creating a new company, find and update the existing one.
  const companyIndex = mockCompanies.findIndex(c => c.id === user.companyId);
  if (companyIndex === -1)
    throw new Error(`Company ${user.companyId} not found for user.`);

  mockCompanies[companyIndex] = {
    ...mockCompanies[companyIndex],
    name: values.companyName,
    industry: values.industry,
    updatedAt: new Date().toISOString(),
  };

  mockUsers[userIndex] = {
    ...user,
    onboardingComplete: true,
    updatedAt: new Date().toISOString(),
  };

  await logAuditEvent(
    'user.onboarded',
    userId,
    { companyId: user.companyId },
    userId,
  );
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  actorId: string,
) {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.fullName = fullName;
    user.updatedAt = new Date().toISOString();
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
  if (current !== 'password123') throw new Error('Incorrect current password.');
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
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.isMfaEnabled = enabled;
    user.updatedAt = new Date().toISOString();
    await logAuditEvent(
      'user.mfa.updated',
      userId,
      { enabled },
      actorId,
    );
  }
  return Promise.resolve();
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  actorId: string,
) {
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { prefs },
    actorId,
  );
  return Promise.resolve();
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  // This function would typically fetch from a database.
  // For now, it returns the mock data.
  const serviceTickets: ServiceTicket[] = []; // Placeholder
  return Promise.resolve(serviceTickets);
}

export async function saveServiceTicket(
  values: SupportTicketFormValues,
  userId?: string,
): Promise<SupportTicket> {
  const validatedData = supportTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: newId('spt'),
    ...validatedData,
    userId,
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };
  console.log('Mock Support Ticket Created:', newTicket);
  await logAuditEvent('support_ticket.created', newTicket.id, {}, userId || 'guest');
  return Promise.resolve(newTicket);
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const serviceTickets: ServiceTicket[] = []; // Placeholder
  const ticketIndex = serviceTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) throw new Error('Ticket not found');
  serviceTickets[ticketIndex].status = status;
  serviceTickets[ticketIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  return Promise.resolve(serviceTickets[ticketIndex]);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  // This function would typically fetch from a database.
  // For now, it returns the mock data.
  const productionLines: ProductionLine[] = [];
  return Promise.resolve(productionLines);
}

export async function saveProductionLine(
  values: ProductionLineFormValues,
  userId: string,
  lineId?: string,
): Promise<ProductionLine> {
  const validatedData = productionLineFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedLine: ProductionLine;
  const productionLines: ProductionLine[] = []; // Placeholder

  const lineData = {
    ...validatedData,
    updatedAt: now,
  };

  if (lineId) {
    const lineIndex = productionLines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) throw new Error('Line not found');
    savedLine = {
      ...productionLines[lineIndex],
      ...lineData,
    };
    productionLines[lineIndex] = savedLine;
    await logAuditEvent('production_line.updated', lineId, {}, userId);
  } else {
    savedLine = {
      id: newId('line'),
      ...lineData,
      lastMaintenance: now,
      createdAt: now,
    };
    productionLines.push(savedLine);
    await logAuditEvent('production_line.created', savedLine.id, {}, userId);
  }
  return Promise.resolve(savedLine);
}

export async function deleteProductionLine(
  lineId: string,
  userId: string,
): Promise<void> {
  const productionLines: ProductionLine[] = []; // Placeholder
  const index = productionLines.findIndex(l => l.id === lineId);
  if (index > -1) {
    productionLines.splice(index, 1);
    await logAuditEvent('production_line.deleted', lineId, {}, userId);
  }
  return Promise.resolve();
}

export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  return authGetUserByEmail(email);
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

  const createdProducts = productsToImport.map(p => {
    const now = new Date().toISOString();
    return {
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
    };
  });

  mockProducts.unshift(...createdProducts);
  await logAuditEvent(
    'product.bulk_import',
    user.companyId,
    { count: createdProducts.length },
    userId,
  );

  return { createdCount: createdProducts.length };
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

export async function runDataValidationCheck(productId: string, userId: string) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:validate_data', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  const { warnings } = await validateProductData({ product: product as any });

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    dataQualityWarnings: warnings,
    lastUpdated: new Date().toISOString(),
  };

  await logAuditEvent(
    'product.validation.run',
    productId,
    { warningsCount: warnings.length },
    userId,
  );
}

export async function runComplianceCheck(productId: string, userId: string) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:run_compliance');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  const compliancePathId = product.compliancePathId;
  if (!compliancePathId) throw new Error('No compliance path set for product.');

  const compliancePath = await getCompliancePathById(compliancePathId);
  if (!compliancePath) throw new Error('Compliance path not found.');

  const result = await summarizeComplianceGaps({
    product: product as any,
    compliancePath,
  });

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    sustainability: {
      ...mockProducts[productIndex].sustainability!,
      isCompliant: result.isCompliant,
      complianceSummary: result.complianceSummary,
      gaps: result.gaps,
    },
    lastUpdated: new Date().toISOString(),
    lastVerificationDate: new Date().toISOString(),
  };

  await logAuditEvent(
    'product.compliance.run',
    productId,
    { result: result.isCompliant },
    userId,
  );
}
