
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { products as mockProducts } from './data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { users as mockUsers } from './user-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { productionLines as mockProductionLines } from './manufacturing-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
  userFormSchema,
  type UserFormValues,
  apiSettingsSchema,
  type ApiSettingsFormValues,
} from './schemas';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { verifyProductAgainstPath } from '@/services/compliance';
import { getUserById, getCompanyById, hasRole, getMockUsers } from './auth';

import type {
  Product,
  SustainabilityData,
  CompliancePath,
  User,
  AuditLog,
  ProductionLine,
  ServiceTicket,
  ApiKey,
  ComplianceGap,
  ApiSettings,
} from '@/types';
import type { AiProduct } from '@/ai/schemas';
import { UserRoles } from './constants';

// --- AUDIT LOGGING ---
export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
) {
  const newLog: AuditLog = {
    id: `log-${randomBytes(4).toString('hex')}`,
    userId,
    action,
    entityId,
    details,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAuditLogs.unshift(newLog);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
  revalidatePath('/dashboard/logs');
  revalidatePath('/dashboard/layout');
}

// --- AI FLOW ORCHESTRATION ---

const runAllAiFlows = async (
  productData: AiProduct,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> => {
  const [
    esgResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({ product: productData }),
    generateQRLabelText({ product: productData }),
    classifyProduct({ product: productData }),
    analyzeProductLifecycle({ product: productData }),
  ]);

  return {
    sustainability: {
      ...esgResult,
      classification: classificationResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      isCompliant: false,
      complianceSummary: 'Awaiting compliance analysis.',
    },
    qrLabelText: qrLabelResult.qrLabelText,
  };
};

// --- PRODUCT ACTIONS ---
export async function getProducts(userId?: string): Promise<Product[]> {
  const user = userId ? await getUserById(userId) : null;
  if (
    user &&
    !hasRole(user, UserRoles.ADMIN) &&
    !hasRole(user, UserRoles.AUDITOR) &&
    !hasRole(user, UserRoles.BUSINESS_ANALYST) &&
    !hasRole(user, UserRoles.RECYCLER) &&
    !hasRole(user, UserRoles.MANUFACTURER) &&
    !hasRole(user, UserRoles.SERVICE_PROVIDER) &&
    !hasRole(user, UserRoles.COMPLIANCE_MANAGER)
  ) {
    return mockProducts.filter(p => p.companyId === user.companyId);
  }
  return mockProducts;
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (!product) return undefined;
  // If a userId is provided, we do an ownership check
  if (userId) {
    const user = await getUserById(userId);
    if (
      user &&
      (hasRole(user, UserRoles.ADMIN) ||
        hasRole(user, UserRoles.AUDITOR) ||
        hasRole(user, UserRoles.RECYCLER) ||
        product.companyId === user.companyId)
    ) {
      return product;
    }
    // if user doesn't have access, return undefined
    return undefined;
  }
  // If no user, it's a public request, only return published products
  if (product.status === 'Published') {
    return product;
  }
  return undefined;
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('Company not found');

  const validatedData = productFormSchema.parse(productData);

  const aiProductInput: AiProduct = { ...validatedData, supplier: company.name };
  const { sustainability, qrLabelText } = await runAllAiFlows(aiProductInput);

  if (validatedData.compliancePathId) {
    const path = await getCompliancePathById(validatedData.compliancePathId);
    if (path) {
      const complianceResult = await summarizeComplianceGaps({
        product: aiProductInput,
        compliancePath: path,
      });
      sustainability.isCompliant = complianceResult.isCompliant;
      sustainability.complianceSummary = complianceResult.complianceSummary;
      sustainability.gaps = complianceResult.gaps;
    }
  }

  const dataToSave = {
    ...validatedData,
    supplier: company.name,
    sustainability,
    qrLabelText,
    lastUpdated: new Date().toISOString(),
  };

  if (productId) {
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found');
    mockProducts[productIndex] = { ...mockProducts[productIndex], ...dataToSave };
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(validatedData) },
      userId,
    );
    revalidatePath('/dashboard/products');
    revalidatePath(`/products/${productId}`);
    return mockProducts[productIndex];
  } else {
    const newProduct: Product = {
      ...dataToSave,
      id: `pp-${randomBytes(4).toString('hex')}`,
      companyId: user.companyId,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    await logAuditEvent(
      'product.created',
      newProduct.id,
      { productName: newProduct.productName },
      userId,
    );
    revalidatePath('/dashboard/products');
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productIndex = mockProducts.findIndex(p => p.id === id);
  if (productIndex > -1) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: mockProducts[productIndex].productName },
      userId,
    );
    mockProducts.splice(productIndex, 1);
  }
  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  mockProducts[productIndex].verificationStatus = 'Pending';
  mockProducts[productIndex].updatedAt = new Date().toISOString();
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/audit');
  revalidatePath(`/products/${productId}`);
  return mockProducts[productIndex];
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = mockProducts[productIndex];

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : null;
  if (!compliancePath) {
    throw new Error('Compliance path not configured for this product.');
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(
    product,
    compliancePath,
  );

  if (!isCompliant) {
    const summary = `Product failed final verification with ${gaps.length} issue(s).`;
    await rejectPassport(product.id, summary, gaps, 'system:gatekeeper');
    throw new Error(
      `Cannot approve: Product is not compliant. Issues found: ${gaps
        .map(g => g.issue)
        .join(', ')}`,
    );
  }

  const dataHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  product.verificationStatus = 'Verified';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  product.blockchainProof = blockchainProof;
  product.ebsiVcId = ebsiVcId;

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return product;
}

export async function rejectPassport(
  productId: string,
  summary: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = mockProducts[productIndex];

  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  if (!product.sustainability) {
    product.sustainability = {} as SustainabilityData;
  }
  product.sustainability.isCompliant = false;
  product.sustainability.complianceSummary = summary;
  product.sustainability.gaps = gaps;

  await logAuditEvent(
    'passport.rejected',
    productId,
    { reason: summary, gaps },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/flagged');
  revalidatePath(`/products/${productId}`);
  return product;
}

export async function runSuggestImprovements(
  data: Pick<ProductFormValues, 'productName' | 'productDescription'>,
): Promise<any> {
  const aiProductInput: AiProduct = {
    ...data,
    category: '',
    supplier: 'Mock Company Name',
    materials: [],
    manufacturing: { facility: '', country: '' },
    certifications: [],
    packaging: { type: '', recyclable: false },
  };
  return suggestImprovements({ product: aiProductInput });
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  mockProducts[productIndex].sustainability = sustainability;
  mockProducts[productIndex].qrLabelText = qrLabelText;
  mockProducts[productIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: sustainability.score },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return mockProducts[productIndex];
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].endOfLifeStatus = 'Recycled';
  mockProducts[productIndex].updatedAt = new Date().toISOString();

  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  revalidatePath('/dashboard');
  return mockProducts[productIndex];
}

// --- AUDIT LOG ACTIONS ---
export async function getAuditLogs(): Promise<AuditLog[]> {
  return mockAuditLogs;
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return mockAuditLogs.filter(log => log.userId === userId);
}

// --- COMPLIANCE PATH ACTIONS ---
export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return mockCompliancePaths;
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | null> {
  return mockCompliancePaths.find(p => p.id === id) || null;
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(pathData);
  const now = new Date().toISOString();

  const dataToSave = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords:
        validatedData.requiredKeywords?.split(',').map(s => s.trim()).filter(Boolean) ||
        [],
      bannedKeywords:
        validatedData.bannedKeywords?.split(',').map(s => s.trim()).filter(Boolean) ||
        [],
    },
    updatedAt: now,
  };

  if (pathId) {
    const pathIndex = mockCompliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Compliance path not found');
    mockCompliancePaths[pathIndex] = {
      ...mockCompliancePaths[pathIndex],
      ...dataToSave,
    };
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: dataToSave.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return mockCompliancePaths[pathIndex];
  } else {
    const newPath: CompliancePath = {
      ...dataToSave,
      id: `cp-${randomBytes(4).toString('hex')}`,
      createdAt: now,
    };
    mockCompliancePaths.unshift(newPath);
    await logAuditEvent(
      'compliance_path.created',
      newPath.id,
      { name: newPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return newPath;
  }
}

// --- USER ACTIONS ---
export async function getUsers(): Promise<User[]> {
  return getMockUsers();
}

export async function saveUser(
  userData: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(userData);
  const now = new Date().toISOString();
  const dataToSave = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...dataToSave };
    await logAuditEvent(
      'user.updated',
      userId,
      { email: validatedData.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return mockUsers[userIndex];
  } else {
    const newUser: User = {
      ...dataToSave,
      id: `user-${randomBytes(4).toString('hex')}`,
      createdAt: now,
    };
    mockUsers.push(newUser);
    await logAuditEvent(
      'user.created',
      newUser.id,
      { email: newUser.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return newUser;
  }
}

export async function deleteUser(
  userId: string,
  adminUserId: string,
): Promise<{ success: boolean }> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    await logAuditEvent(
      'user.deleted',
      userId,
      { email: mockUsers[userIndex].email },
      adminUserId,
    );
    mockUsers.splice(userIndex, 1);
  }
  revalidatePath('/dashboard/users');
  return { success: true };
}

// --- NOTIFICATION ACTIONS ---
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<User> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');

  const allLogIds = mockAuditLogs.map(log => log.id);
  mockUsers[userIndex].readNotificationIds = allLogIds;
  mockUsers[userIndex].updatedAt = new Date().toISOString();

  await logAuditEvent('notifications.read_all', userId, {}, userId);
  revalidatePath('/dashboard/layout');
  return mockUsers[userIndex];
}

// --- SETTINGS ACTIONS ---
export async function updateUserProfile(
  userId: string,
  fullName: string,
): Promise<User> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');
  mockUsers[userIndex].fullName = fullName;
  mockUsers[userIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('user.profile.updated', userId, { fullName }, userId);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/layout');
  return mockUsers[userIndex];
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
): Promise<{ success: boolean }> {
  if (current !== 'password123') {
    throw new Error('Current password does not match.');
  }
  await logAuditEvent('user.password.updated', userId, {}, userId);
  return { success: true };
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: Record<string, boolean>,
): Promise<{ success: boolean }> {
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { preferences: prefs },
    userId,
  );
  return { success: true };
}

// --- API KEY ACTIONS ---
export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return mockApiKeys.filter(key => key.userId === userId);
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const rawToken = `nor_live_${randomBytes(16).toString('hex')}`;
  const newApiKey: ApiKey = {
    id: `key-${randomBytes(4).toString('hex')}`,
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockApiKeys.unshift(newApiKey);
  await logAuditEvent('api_key.created', newApiKey.id, { label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { rawToken, apiKey: newApiKey };
}

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const keyIndex = mockApiKeys.findIndex(k => k.id === id);
  if (keyIndex === -1) throw new Error('API Key not found');
  mockApiKeys[keyIndex].status = 'Revoked';
  mockApiKeys[keyIndex].updatedAt = new Date().toISOString();
  await logAuditEvent(
    'api_key.revoked',
    id,
    { label: mockApiKeys[keyIndex].label },
    userId,
  );
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return mockApiKeys[keyIndex];
}

export async function deleteApiKey(
  id: string,
  userId: string,
): Promise<{ success: true }> {
  const keyIndex = mockApiKeys.findIndex(k => k.id === id);
  if (keyIndex > -1) {
    await logAuditEvent(
      'api_key.deleted',
      id,
      { label: mockApiKeys[keyIndex].label },
      userId,
    );
    mockApiKeys.splice(keyIndex, 1);
  }
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- API SETTINGS ACTIONS ---
export async function getApiSettings(): Promise<ApiSettings> {
  return mockApiSettings;
}

export async function saveApiSettings(
  settings: ApiSettingsFormValues,
  adminUserId: string,
): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(settings);
  mockApiSettings.isPublicApiEnabled = validatedData.isPublicApiEnabled;
  mockApiSettings.rateLimitPerMinute = validatedData.rateLimitPerMinute;
  mockApiSettings.isWebhookSigningEnabled = validatedData.isWebhookSigningEnabled;
  await logAuditEvent(
    'settings.api.updated',
    'global',
    { settings: validatedData },
    adminUserId,
  );
  revalidatePath('/dashboard/api-settings');
  return mockApiSettings;
}

// --- OTHER MOCK DATA ACTIONS ---
export async function getProductionLines(): Promise<ProductionLine[]> {
  return mockProductionLines;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return mockServiceTickets;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  mockProducts[productIndex].verificationStatus = 'Draft';
  mockProducts[productIndex].updatedAt = new Date().toISOString();
  await logAuditEvent(
    'compliance.resolved',
    productId,
    { newStatus: 'Draft' },
    userId,
  );
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  return mockProducts[productIndex];
}
