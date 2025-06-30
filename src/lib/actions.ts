// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

// --- Mock Data Imports ---
import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import {
  productionLines as mockProductionLines,
} from './manufacturing-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';

// --- Schema & Type Imports ---
import {
  type ApiSettingsFormValues,
  type CompanyFormValues,
  type CompliancePathFormValues,
  type ProductFormValues,
  type UserFormValues,
} from './schemas';
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
  SustainabilityData,
} from '@/types';
import { UserRoles } from './constants';
import type { AiProduct } from '@/ai/schemas';
import type { SuggestImprovementsInput } from '@/ai/flows/enhance-passport-information';
import { getCompanyById, getUserById } from './auth';

// --- Service & AI Flow Imports ---
import * as blockchainService from '@/services/blockchain';
import { verifyProductAgainstPath } from '@/services/compliance';

// --- Helper Functions ---

/**
 * A centralized function to log audit events.
 * @param action A string describing the action (e.g., 'product.created').
 * @param entityId The ID of the entity that was acted upon.
 * @param details An object with any relevant details about the event.
 * @param userId The ID of the user who performed the action.
 */
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
  mockAuditLogs.unshift(newLog); // Add to the beginning of the array
  // In a real app, you might revalidate paths that show audit logs here.
}

/**
 * Runs the full suite of AI enhancement and compliance analysis for a product.
 * @param product The product data to enhance.
 * @returns A promise resolving to the AI-enhanced data fields.
 */
async function runAiEnhancement(
  product: Product,
): Promise<Partial<Pick<Product, 'sustainability' | 'qrLabelText' | 'dataQualityWarnings'>>> {
  // This function is a placeholder. In a real application, it would
  // call the Genkit AI flows to get the data.
  // For now, we return mock data.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  return {
    sustainability: {
      score: Math.floor(Math.random() * 40) + 60, // 60-99
      environmental: Math.floor(Math.random() * 40) + 60,
      social: Math.floor(Math.random() * 40) + 60,
      governance: Math.floor(Math.random() * 40) + 60,
      isCompliant: true,
      complianceSummary: 'Product appears compliant based on initial data.',
      summary: 'This product demonstrates strong sustainability practices.'
    },
    qrLabelText: `Learn more about the sustainable journey of ${product.productName}.`,
    dataQualityWarnings: [],
  }
}

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  // In a real app, filtering would be based on user's company/permissions.
  // For now, we return all products.
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

  // In a real app, you would check if the user has permission to view this product.
  // For the public page, we only show published products.
  if (!userId && product.status !== 'Published') {
    return undefined;
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

  let product: Product;
  const isNew = !productId;

  if (isNew) {
    const newId = `pp-${randomBytes(3).toString('hex')}`;
    product = {
      id: newId,
      companyId: user.companyId,
      createdAt: new Date().toISOString(),
      ...values,
      supplier: (await getCompanyById(user.companyId))?.name || 'Unknown',
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationStatus: 'Not Submitted',
      materials: values.materials || [],
      certifications: values.certifications || [],
    };
  } else {
    const existingProduct = mockProducts.find(p => p.id === productId);
    if (!existingProduct) throw new Error('Product not found');
    product = { ...existingProduct, ...values, updatedAt: new Date().toISOString() };
  }

  const aiData = await runAiEnhancement(product);
  Object.assign(product, aiData);

  if (isNew) {
    mockProducts.push(product);
    await logAuditEvent('product.created', product.id, { name: product.productName }, userId);
  } else {
    const index = mockProducts.findIndex(p => p.id === productId);
    mockProducts[index] = product;
    await logAuditEvent('product.updated', product.id, { name: product.productName }, userId);
  }

  revalidatePath('/dashboard');
  return product;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const index = mockProducts.findIndex(p => p.id === productId);
  if (index > -1) {
    const deletedProduct = mockProducts[index];
    mockProducts.splice(index, 1);
    await logAuditEvent('product.deleted', productId, { name: deletedProduct.productName }, userId);
    revalidatePath('/dashboard');
  }
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.verificationStatus = 'Pending';
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const aiData = await runAiEnhancement(product);
  Object.assign(product, aiData);
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const hash = await blockchainService.hashProductData(product);
  const proof = await blockchainService.anchorToPolygon(productId, hash);
  const vcId = await blockchainService.generateEbsiCredential(productId);

  product.verificationStatus = 'Verified';
  product.status = 'Published';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  product.blockchainProof = proof;
  product.ebsiVcId = vcId;

  await logAuditEvent('passport.approved', productId, { txHash: proof.txHash }, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: any[], // TODO: Fix type
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  if (product.sustainability) {
    product.sustainability.isCompliant = false;
    product.sustainability.complianceSummary = reason;
    product.sustainability.gaps = gaps;
  }

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.verificationStatus = 'Not Submitted';
  product.status = 'Draft';
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.endOfLifeStatus = 'Recycled';
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard');
  return product;
}

export async function runSuggestImprovements(input: SuggestImprovementsInput) {
    // This is a placeholder for the actual AI flow call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        recommendations: [
            { type: 'Material', text: 'Consider using recycled packaging materials.' },
            { type: 'Data Quality', text: 'Add origin country for all materials.' },
            { type: 'Compliance', text: 'Verify compliance with the latest EU directives.' },
        ]
    };
}


// --- USER & COMPANY ACTIONS ---

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
    readNotificationIds: [],
  };
  mockUsers.push(newUser);
  await logAuditEvent('user.created', newUser.id, { companyId: newCompany.id }, uid);
  await logAuditEvent('company.created', newCompany.id, { userId: newUser.id }, uid);
}

export async function getCompanies(): Promise<Company[]> {
  return [...mockCompanies];
}

export async function saveCompany(
  values: CompanyFormValues,
  adminUserId: string,
  companyId?: string,
): Promise<Company> {
  let company: Company;
  if (companyId) {
    const existing = mockCompanies.find(c => c.id === companyId);
    if (!existing) throw new Error('Company not found');
    company = { ...existing, ...values, updatedAt: new Date().toISOString() };
    const index = mockCompanies.findIndex(c => c.id === companyId);
    mockCompanies[index] = company;
    await logAuditEvent('company.updated', companyId, values, adminUserId);
  } else {
    company = {
      id: `comp-${randomBytes(3).toString('hex')}`,
      ...values,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCompanies.push(company);
    await logAuditEvent('company.created', company.id, values, adminUserId);
  }
  revalidatePath('/dashboard');
  return company;
}

export async function deleteCompany(
  companyId: string,
  adminUserId: string,
): Promise<void> {
  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index > -1) {
    mockCompanies.splice(index, 1);
    await logAuditEvent('company.deleted', companyId, {}, adminUserId);
    revalidatePath('/dashboard');
  }
}

export async function saveUser(
  values: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  let user: User;
  if (userId) {
    const existing = mockUsers.find(u => u.id === userId);
    if (!existing) throw new Error('User not found');
    user = {
      ...existing,
      ...values,
      roles: [values.role],
      updatedAt: new Date().toISOString(),
    };
    const index = mockUsers.findIndex(u => u.id === userId);
    mockUsers[index] = user;
    await logAuditEvent('user.updated', userId, values, adminUserId);
  } else {
    user = {
      id: `user-${randomBytes(3).toString('hex')}`,
      ...values,
      roles: [values.role],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readNotificationIds: [],
    };
    mockUsers.push(user);
    await logAuditEvent('user.invited', user.id, values, adminUserId);
  }
  revalidatePath('/dashboard');
  return user;
}

export async function deleteUser(
  userId: string,
  adminUserId: string,
): Promise<void> {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, {}, adminUserId);
    revalidatePath('/dashboard');
  }
}

// --- OTHER ACTIONS ---

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...mockAuditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
    const logs = mockAuditLogs.filter(log => log.userId === userId);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return [...mockCompliancePaths];
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
  const pathData: CompliancePath = {
    id: pathId || `cp-${randomBytes(3).toString('hex')}`,
    name: values.name,
    description: values.description,
    category: values.category,
    regulations: values.regulations.split(',').map(s => s.trim()),
    rules: {
      minSustainabilityScore: values.minSustainabilityScore
        ? Number(values.minSustainabilityScore)
        : undefined,
      requiredKeywords:
        values.requiredKeywords?.split(',').map(s => s.trim()) || [],
      bannedKeywords:
        values.bannedKeywords?.split(',').map(s => s.trim()) || [],
    },
    createdAt: pathId
      ? mockCompliancePaths.find(p => p.id === pathId)!.createdAt
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (pathId) {
    const index = mockCompliancePaths.findIndex(p => p.id === pathId);
    mockCompliancePaths[index] = pathData;
  } else {
    mockCompliancePaths.push(pathData);
  }
  await logAuditEvent('compliance_path.saved', pathData.id, { name: pathData.name }, userId);
  revalidatePath('/dashboard');
  return pathData;
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return [...mockProductionLines];
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return [...mockServiceTickets];
}

export async function exportProducts(
  format: 'csv' | 'json',
): Promise<string> {
  if (format === 'json') {
    return JSON.stringify(mockProducts, null, 2);
  } else {
    const headers = Object.keys(mockProducts[0]).join(',');
    const rows = mockProducts.map(product => {
      return Object.values(product)
        .map(value => {
          if (typeof value === 'string') return `"${value}"`;
          if (typeof value === 'object' && value !== null)
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return value;
        })
        .join(',');
    });
    return [headers, ...rows].join('\n');
  }
}

export async function getApiSettings(): Promise<ApiSettings> {
  return mockApiSettings;
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  Object.assign(mockApiSettings, values);
  await logAuditEvent('settings.api.updated', 'global', values, userId);
  revalidatePath('/dashboard');
  return mockApiSettings;
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return mockApiKeys.filter(key => key.userId === userId);
}

export async function createApiKey(label: string, userId: string): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const rawToken = `nor_prod_${randomBytes(16).toString('hex')}`;
  const newKey: ApiKey = {
    id: `key-${randomBytes(3).toString('hex')}`,
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockApiKeys.push(newKey);
  await logAuditEvent('api_key.created', newKey.id, { label }, userId);
  revalidatePath('/dashboard');
  return { rawToken, apiKey: newKey };
}

export async function revokeApiKey(keyId: string, userId: string): Promise<ApiKey> {
  const key = mockApiKeys.find(k => k.id === keyId);
  if (!key) throw new Error('API Key not found');
  key.status = 'Revoked';
  key.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', key.id, {}, userId);
  revalidatePath('/dashboard');
  return key;
}

export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
    const index = mockApiKeys.findIndex(k => k.id === keyId);
    if(index > -1) {
        mockApiKeys.splice(index, 1);
        await logAuditEvent('api_key.deleted', keyId, {}, userId);
        revalidatePath('/dashboard');
    }
}

export async function updateUserProfile(userId: string, fullName: string) {
    const user = mockUsers.find(u => u.id === userId);
    if(!user) throw new Error('User not found');
    user.fullName = fullName;
    user.updatedAt = new Date().toISOString();
    await logAuditEvent('user.profile.updated', userId, { fullName }, userId);
    revalidatePath('/dashboard');
}

export async function updateUserPassword(userId: string, current: string, newPass: string) {
    // This is a mock. In a real app, this would be a secure Firebase Auth operation.
    if(current !== 'password123') throw new Error('Incorrect current password.');
    console.log(`Password for user ${userId} changed to ${newPass}`);
    await logAuditEvent('user.password.updated', userId, {}, userId);
    revalidatePath('/dashboard');
}

export async function saveNotificationPreferences(userId: string, prefs: any) {
    // Mock implementation
    console.log(`Notification preferences for ${userId} saved:`, prefs);
    await logAuditEvent('user.notifications.updated', userId, {}, userId);
    revalidatePath('/dashboard');
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const user = await getUserById(userId);
    if (!user) return;
    const allLogIds = mockAuditLogs.map(log => log.id);
    user.readNotificationIds = [...new Set([...(user.readNotificationIds || []), ...allLogIds])];
    revalidatePath('/dashboard');
    console.log(`Marked all notifications as read for ${userId}`);
}
