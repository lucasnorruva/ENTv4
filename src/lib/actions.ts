// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
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
} from './types';
import {
  productFormSchema,
  type ProductFormValues,
  userFormSchema,
  UserFormValues,
  companyFormSchema,
  CompanyFormValues,
  compliancePathFormSchema,
  CompliancePathFormValues,
  apiSettingsSchema,
  ApiSettingsFormValues,
} from './schemas';
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
} from '@/types/ai-outputs';
import { AiProduct } from '@/ai/schemas';
import {
  compliancePaths,
  getCompliancePathById as getPathById,
} from './compliance-data';
import { companies as mockCompanies } from './company-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { users as mockUsers } from './user-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { apiSettings as mockApiSettings } from './api-settings-data';
import { productionLines as mockProductionLines } from './manufacturing-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { getCurrentUser, getUserById } from './auth';

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  const allProducts = mockProducts.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );

  if (!userId) {
    return allProducts;
  }
  
  const user = await getUserById(userId);
  if (user?.roles.includes('Admin')) {
    return allProducts;
  }
  
  return allProducts.filter(p => p.companyId === user?.companyId);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (!product) {
    return undefined;
  }
  // If no user is provided, only return published products
  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }
  const user = await getUserById(userId); 
  if(!user) return undefined;
  
  // Admins can see everything. Others can see their own company's products.
  if (user.roles.includes('Admin') || user.companyId === product.companyId) {
    return product;
  }
  // Fallback for other roles to only see published products (e.g., an Auditor from another company)
  return product.status === 'Published' ? product : undefined;
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(values);
  const now = new Date().toISOString();
  let product: Product;

  if (productId) {
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');
    const existingProduct = mockProducts[index];
    product = {
      ...existingProduct,
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      // If a failed product is edited, reset its verification status
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
    };
    mockProducts[index] = product;
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    const user = await getUserById(userId);
    product = {
      id: `pp-${Date.now().toString().slice(-6)}`,
      companyId: user!.companyId,
      ...validatedData,
      supplier: 'GreenTech Supplies',
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
    };
    mockProducts.unshift(product);
    await logAuditEvent('product.created', product.id, {}, userId);
  }

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const index = mockProducts.findIndex(p => p.id === productId);
  if (index > -1) {
    mockProducts.splice(index, 1);
    await logAuditEvent('product.deleted', productId, {}, userId);
    revalidatePath('/dashboard', 'layout');
  } else {
    throw new Error('Product not found');
  }
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Pending';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
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

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
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
    { txHash: blockchainProof.txHash },
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
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  if (!product.sustainability) {
    product.sustainability = {
      score: 0,
      environmental: 0,
      social: 0,
      governance: 0,
      isCompliant: false,
      complianceSummary: '',
    };
  }
  product.sustainability.complianceSummary = reason;
  product.sustainability.gaps = gaps;

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.endOfLifeStatus = 'Recycled';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Not Submitted';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function exportProducts(
  format: 'csv' | 'json',
): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }
  // CSV export
  const headers = Object.keys(products[0]).join(',');
  const rows = products.map(product => {
    return Object.values(product)
      .map(value => {
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object' && value !== null)
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return value;
      })
      .join(',');
  });
  return `${headers}\n${rows.join('\n')}`;
}

// --- AI FLOW ACTIONS ---

export async function runSuggestImprovements(
  input: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  return suggestImprovements({
    productName: input.productName,
    productDescription: input.productDescription,
  });
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  return mockCompanies;
}

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const now = new Date().toISOString();
  let company: Company;
  if (companyId) {
    const index = mockCompanies.findIndex(c => c.id === companyId);
    if (index === -1) throw new Error('Company not found');
    company = { ...mockCompanies[index], ...validatedData, updatedAt: now };
    mockCompanies[index] = company;
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    company = {
      id: `comp-${Date.now().toString().slice(-6)}`,
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    };
    mockCompanies.push(company);
    await logAuditEvent('company.created', company.id, {}, userId);
  }
  revalidatePath('/dashboard/admin/companies');
  return company;
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index > -1) {
    mockCompanies.splice(index, 1);
    await logAuditEvent('company.deleted', companyId, {}, userId);
    revalidatePath('/dashboard/admin/companies');
  } else {
    throw new Error('Company not found');
  }
}

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const now = new Date().toISOString();
  let user: User;

  if (userId) {
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    user = {
      ...mockUsers[index],
      fullName: validatedData.fullName,
      email: validatedData.email,
      companyId: validatedData.companyId,
      roles: [validatedData.role],
      updatedAt: now,
    };
    mockUsers[index] = user;
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    user = {
      id: `user-${Date.now().toString().slice(-6)}`,
      fullName: validatedData.fullName,
      email: validatedData.email,
      companyId: validatedData.companyId,
      roles: [validatedData.role],
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.push(user);
    await logAuditEvent('user.created', user.id, {}, adminId);
  }
  revalidatePath('/dashboard/admin/users');
  return user;
}

export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, {}, adminId);
    revalidatePath('/dashboard/admin/users');
  } else {
    throw new Error('User not found');
  }
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return compliancePaths;
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  return getPathById(id);
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(values);
  const now = new Date().toISOString();
  let path: CompliancePath;

  const rules = {
    minSustainabilityScore: validatedData.minSustainabilityScore,
    requiredKeywords: validatedData.requiredKeywords
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean),
    bannedKeywords: validatedData.bannedKeywords
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };

  if (pathId) {
    const index = compliancePaths.findIndex(p => p.id === pathId);
    if (index === -1) throw new Error('Path not found');
    path = {
      ...compliancePaths[index],
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      regulations: validatedData.regulations
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      rules,
      updatedAt: now,
    };
    compliancePaths[index] = path;
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    path = {
      id: `cp-${Date.now().toString().slice(-6)}`,
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      regulations: validatedData.regulations
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      rules,
      createdAt: now,
      updatedAt: now,
    };
    compliancePaths.push(path);
    await logAuditEvent('compliance_path.created', path.id, {}, userId);
  }
  revalidatePath('/dashboard/admin/compliance');
  revalidatePath('/dashboard/auditor/compliance');
  revalidatePath('/dashboard/compliance-manager/compliance');
  return path;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return mockAuditLogs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  mockAuditLogs.unshift(log);
  return log;
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return mockApiKeys.filter(key => key.userId === userId);
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ key: ApiKey; rawToken: string }> {
  const now = new Date().toISOString();
  const rawToken = `nor_prod_${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const key: ApiKey = {
    id: `key-${Date.now().toString().slice(-6)}`,
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: now,
    updatedAt: now,
  };
  mockApiKeys.push(key);
  await logAuditEvent('api_key.created', key.id, { label }, userId);
  revalidatePath('/dashboard/developer/keys');
  return { key, rawToken };
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const key = mockApiKeys.find(k => k.id === keyId && k.userId === userId);
  if (!key) throw new Error('API Key not found');
  key.status = 'Revoked';
  key.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  revalidatePath('/dashboard/developer/keys');
  return key;
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const index = mockApiKeys.findIndex(k => k.id === keyId && k.userId === userId);
  if (index > -1) {
    mockApiKeys.splice(index, 1);
    await logAuditEvent('api_key.deleted', keyId, {}, userId);
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
  const validatedData = apiSettingsSchema.parse(values);
  Object.assign(mockApiSettings, validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  revalidatePath('/dashboard/admin/api-settings');
  return mockApiSettings;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return mockServiceTickets;
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return mockProductionLines;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (!user.readNotificationIds) {
    user.readNotificationIds = [];
  }
  const allLogIds = mockAuditLogs.map(log => log.id);
  user.readNotificationIds = [...new Set([...user.readNotificationIds, ...allLogIds])];
  revalidatePath('/dashboard', 'layout');
}

export async function createUserAndCompany(name: string, email: string, userId: string) {
    const company: Company = {
        id: `comp-${userId.slice(0,6)}`,
        name: `${name}'s Company`,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    mockCompanies.push(company);

    const user: User = {
        id: userId,
        fullName: name,
        email: email,
        companyId: company.id,
        roles: [UserRoles.SUPPLIER],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    mockUsers.push(user);
}

export async function updateUserProfile(userId: string, fullName: string) {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    user.fullName = fullName;
    user.updatedAt = new Date().toISOString();
    revalidatePath('/dashboard', 'layout');
}

export async function updateUserPassword(userId: string, current: string, newPass: string) {
    // This is a mock. In a real app, you'd use Firebase Auth admin SDK to verify
    // the current password and update it.
    console.log(`Updating password for ${userId}. Mock action successful.`);
    if(current !== 'password123') throw new Error("Incorrect current password.");
    await new Promise(res => setTimeout(res, 500));
}

export async function saveNotificationPreferences(userId: string, prefs: any) {
    console.log(`Saving notification preferences for ${userId}`, prefs);
    await new Promise(res => setTimeout(res, 500));
}
