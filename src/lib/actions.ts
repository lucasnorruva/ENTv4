// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import { productionLines as mockProductionLines } from './manufacturing-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';

import type {
  Product,
  User,
  Company,
  CompliancePath,
  AuditLog,
  ApiKey,
  ApiSettings,
  ProductionLine,
  ServiceTicket,
  ComplianceGap,
} from '@/types';
import type {
  ProductFormValues,
  CompanyFormValues,
  CompliancePathFormValues,
  UserFormValues,
  ApiSettingsFormValues,
} from './schemas';
import { UserRoles } from './constants';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { validateProductData } from '@/ai/flows/validate-product-data';
import type {
  SuggestImprovementsInput,
  SuggestImprovementsOutput,
  AiProduct,
} from '@/types/ai-outputs';
import { getUserById } from './auth';
import { verifyProductAgainstPath } from '@/services/compliance';

// --- UTILITY / HELPERS ---

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
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
  mockAuditLogs.push(newLog);
  // No revalidation needed for audit logs in this context
}

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  if (userId) {
    const user = await getUserById(userId);
    if (user && !user.roles.includes(UserRoles.ADMIN)) {
      return mockProducts.filter(p => p.companyId === user.companyId);
    }
  }
  return [...mockProducts].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (!product) return undefined;
  if (!userId && product.status !== 'Published') return undefined;
  if (userId) {
    const user = await getUserById(userId);
    if (
      !user ||
      (!user.roles.includes(UserRoles.ADMIN) &&
        user.companyId !== product.companyId)
    ) {
      return undefined;
    }
  }
  return product;
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const company = mockCompanies.find(c => c.id === user.companyId);
  if (!company) throw new Error('Company not found');

  const now = new Date().toISOString();
  let product: Product;

  if (productId) {
    const existingProduct = mockProducts.find(p => p.id === productId);
    if (!existingProduct || existingProduct.companyId !== user.companyId) {
      throw new Error('Product not found or access denied');
    }
    product = {
      ...existingProduct,
      ...values,
      productImage: values.productImage || existingProduct.productImage,
      lastUpdated: now,
      updatedAt: now,
      materials: values.materials || existingProduct.materials,
      certifications: values.certifications || existingProduct.certifications,
      packaging: values.packaging || existingProduct.packaging,
      manufacturing: values.manufacturing || existingProduct.manufacturing,
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
    };
    const index = mockProducts.findIndex(p => p.id === productId);
    mockProducts[index] = product;
    await logAuditEvent(
      'product.updated',
      product.id,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    product = {
      id: `pp-${randomBytes(3).toString('hex')}`,
      companyId: user.companyId,
      supplier: company.name,
      ...values,
      productImage: values.productImage || 'https://placehold.co/100x100.png',
      materials: values.materials || [],
      certifications: values.certifications || [],
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
    };
    mockProducts.unshift(product);
    await logAuditEvent(
      'product.created',
      product.id,
      { productName: product.productName },
      userId,
    );
  }

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const index = mockProducts.findIndex(
    p => p.id === productId && p.companyId === user.companyId,
  );
  if (index > -1) {
    const deletedProduct = mockProducts[index];
    mockProducts.splice(index, 1);
    await logAuditEvent(
      'product.deleted',
      deletedProduct.id,
      { productName: deletedProduct.productName },
      userId,
    );
    revalidatePath('/dashboard', 'layout');
  } else {
    throw new Error('Product not found or access denied');
  }
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing,
    certifications,
    verificationStatus,
    sustainability,
  } = product;

  const aiProductInput: AiProduct = {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing: manufacturing!,
    certifications: certifications!,
    verificationStatus,
    complianceSummary: sustainability?.complianceSummary,
  };

  const [esgResult, qrLabelResult, validationResult] = await Promise.all([
    calculateSustainability({ product: aiProductInput }),
    generateQRLabelText({ product: aiProductInput }),
    validateProductData({ product: aiProductInput }),
  ]);

  product.sustainability = { ...product.sustainability, ...esgResult };
  product.qrLabelText = qrLabelResult.qrLabelText;
  product.dataQualityWarnings = validationResult.warnings;
  product.lastUpdated = new Date().toISOString();

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Pending';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const productHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(product.id, productHash),
    generateEbsiCredential(product.id),
  ]);

  product.verificationStatus = 'Verified';
  product.lastVerificationDate = new Date().toISOString();
  product.blockchainProof = blockchainProof;
  product.ebsiVcId = ebsiVcId;

  await logAuditEvent(
    'passport.approved',
    productId,
    { approver: userId },
    userId,
  );
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  if (!product.sustainability) {
    product.sustainability = {
      score: 0,
      environmental: 0,
      social: 0,
      governance: 0,
      summary: '',
      isCompliant: false,
      complianceSummary: '',
    };
  }
  product.sustainability.complianceSummary = reason;
  product.sustainability.gaps = gaps;
  await logAuditEvent(
    'passport.rejected',
    productId,
    { reason, gaps },
    userId,
  );
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Not Submitted';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  product.endOfLifeStatus = 'Recycled';
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }
  // Simple CSV conversion
  const headers = Object.keys(products[0]).join(',');
  const rows = products.map(p => {
    return Object.values(p)
      .map(value => {
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(',');
  });
  return [headers, ...rows].join('\n');
}

// --- USER & COMPANY ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  return mockCompanies;
}

export async function createUserAndCompany(
  fullName: string,
  email: string,
  uid: string,
) {
  const newCompany: Company = {
    id: `comp-${randomBytes(2).toString('hex')}`,
    name: `${fullName}'s Company`,
    ownerId: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockCompanies.push(newCompany);

  const newUser: User = {
    id: uid,
    fullName: fullName,
    email: email,
    companyId: newCompany.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
}

export async function saveUser(
  values: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  if (userId) {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    user.fullName = values.fullName;
    user.email = values.email;
    user.companyId = values.companyId;
    user.roles = [values.role];
    user.updatedAt = new Date().toISOString();
    await logAuditEvent(
      'user.updated',
      userId,
      { by: adminUserId },
      adminUserId,
    );
    revalidatePath('/dashboard/admin/users');
    return user;
  }
  const newUser: User = {
    id: `user-${randomBytes(3).toString('hex')}`,
    ...values,
    roles: [values.role],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  await logAuditEvent(
    'user.created',
    newUser.id,
    { by: adminUserId },
    adminUserId,
  );
  revalidatePath('/dashboard/admin/users');
  return newUser;
}

export async function deleteUser(
  userId: string,
  adminUserId: string,
): Promise<void> {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, { by: adminUserId }, adminUserId);
    revalidatePath('/dashboard/admin/users');
  } else {
    throw new Error('User not found');
  }
}

export async function saveCompany(
  values: CompanyFormValues,
  adminUserId: string,
  companyId?: string,
): Promise<Company> {
  if (companyId) {
    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');
    company.name = values.name;
    company.ownerId = values.ownerId;
    company.updatedAt = new Date().toISOString();
    await logAuditEvent(
      'company.updated',
      companyId,
      { by: adminUserId },
      adminUserId,
    );
    revalidatePath('/dashboard/admin/companies');
    return company;
  }
  const newCompany: Company = {
    id: `comp-${randomBytes(2).toString('hex')}`,
    ...values,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockCompanies.push(newCompany);
  await logAuditEvent(
    'company.created',
    newCompany.id,
    { by: adminUserId },
    adminUserId,
  );
  revalidatePath('/dashboard/admin/companies');
  return newCompany;
}

export async function deleteCompany(
  companyId: string,
  adminUserId: string,
): Promise<void> {
  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index > -1) {
    mockCompanies.splice(index, 1);
    await logAuditEvent(
      'company.deleted',
      companyId,
      { by: adminUserId },
      adminUserId,
    );
    revalidatePath('/dashboard/admin/companies');
  } else {
    throw new Error('Company not found');
  }
}

// --- COMPLIANCE PATH ACTIONS ---
export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return mockCompliancePaths;
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  return mockCompliancePaths.find(p => p.id === id);
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const now = new Date().toISOString();
  const regulations = values.regulations.split(',').map(s => s.trim());
  const rules = {
    minSustainabilityScore: values.minSustainabilityScore,
    requiredKeywords:
      values.requiredKeywords?.split(',').map(s => s.trim()) || [],
    bannedKeywords: values.bannedKeywords?.split(',').map(s => s.trim()) || [],
  };

  if (pathId) {
    const path = mockCompliancePaths.find(p => p.id === pathId);
    if (!path) throw new Error('Compliance path not found');
    path.name = values.name;
    path.description = values.description;
    path.category = values.category;
    path.regulations = regulations;
    path.rules = rules;
    path.updatedAt = now;
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { by: userId },
      userId,
    );
    revalidatePath('/dashboard/admin/compliance');
    return path;
  }

  const newPath: CompliancePath = {
    id: `cp-${randomBytes(3).toString('hex')}`,
    name: values.name,
    description: values.description,
    category: values.category,
    regulations,
    rules,
    createdAt: now,
    updatedAt: now,
  };
  mockCompliancePaths.push(newPath);
  await logAuditEvent(
    'compliance_path.created',
    newPath.id,
    { by: userId },
    userId,
  );
  revalidatePath('/dashboard/admin/compliance');
  return newPath;
}

// --- API & SETTINGS ACTIONS ---

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return mockApiKeys.filter(key => key.userId === userId);
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ apiKey: ApiKey; rawToken: string }> {
  const rawToken = `nor_prod_${randomBytes(16).toString('hex')}`;
  const newApiKey: ApiKey = {
    id: `key-${randomBytes(3).toString('hex')}`,
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockApiKeys.push(newApiKey);
  await logAuditEvent(
    'api_key.created',
    newApiKey.id,
    { by: userId },
    userId,
  );
  revalidatePath('/dashboard/developer/keys');
  return { apiKey: newApiKey, rawToken };
}

export async function revokeApiKey(keyId: string, userId: string): Promise<ApiKey> {
  const apiKey = mockApiKeys.find(k => k.id === keyId && k.userId === userId);
  if (!apiKey) throw new Error('API Key not found');
  apiKey.status = 'Revoked';
  apiKey.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', keyId, { by: userId }, userId);
  revalidatePath('/dashboard/developer/keys');
  return apiKey;
}

export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
  const index = mockApiKeys.findIndex(
    k => k.id === keyId && k.userId === userId,
  );
  if (index > -1) {
    mockApiKeys.splice(index, 1);
    await logAuditEvent('api_key.deleted', keyId, { by: userId }, userId);
    revalidatePath('/dashboard/developer/keys');
  } else {
    throw new Error('API Key not found');
  }
}

export async function getApiSettings(): Promise<ApiSettings> {
  return mockApiSettings;
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  mockApiSettings.isPublicApiEnabled = values.isPublicApiEnabled;
  mockApiSettings.rateLimitPerMinute = values.rateLimitPerMinute;
  mockApiSettings.isWebhookSigningEnabled = values.isWebhookSigningEnabled;
  await logAuditEvent('settings.api.updated', 'global', { by: userId }, userId);
  revalidatePath('/dashboard/admin/api-settings');
  return mockApiSettings;
}

// --- MISC DATA ACTIONS ---

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...mockAuditLogs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return mockAuditLogs
    .filter(log => log.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return mockProductionLines;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return mockServiceTickets;
}

export async function runSuggestImprovements(
  input: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  return suggestImprovements({
    productName: input.productName,
    productDescription: input.productDescription,
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const allLogs = await getAuditLogs();
  const allLogIds = allLogs.map(log => log.id);

  user.readNotificationIds = [
    ...new Set([...(user.readNotificationIds || []), ...allLogIds]),
  ];
  console.log(`User ${userId} notifications marked as read.`);
  // No revalidation needed for this, as it will trigger a client-side re-render.
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  user.fullName = fullName;
  await logAuditEvent('user.profile.updated', userId, { by: userId }, userId);
  revalidatePath('/dashboard', 'layout');
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
): Promise<void> {
  // This is a mock. In a real app, this would involve Firebase Auth admin SDK
  // to verify the current password and set a new one.
  if (current !== 'password123') {
    throw new Error('Incorrect current password.');
  }
  console.log(`Password for user ${userId} updated.`);
  await logAuditEvent('user.password.updated', userId, { by: userId }, userId);
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
): Promise<void> {
  // This is a mock.
  console.log(`Notification preferences for user ${userId} saved.`);
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { prefs, by: userId },
    userId,
  );
}
