
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
import type { SuggestImprovementsInput, SuggestImprovementsOutput } from '@/types/ai-outputs';


// In a real app, you would have a more robust way to get the current user
// and their company. For now, we'll simulate it.
async function getCurrentUser(userId: string) {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  const company = mockCompanies.find(c => c.id === user.companyId);
  if (!company) {
    throw new Error('Company not found');
  }
  return { user, company };
}

export async function getProducts(userId?: string): Promise<Product[]> {
  // If a userId is provided, filter products by their company.
  // This is a basic form of multi-tenancy.
  if (userId) {
    const user = await getUserById(userId);
    if (user && !user.roles.includes(UserRoles.ADMIN)) {
      return mockProducts.filter(p => p.companyId === user.companyId);
    }
  }
  // In a public context or for admins, return all products (for now).
  // A real app would have stricter rules.
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

  if (!product) {
    return undefined;
  }

  // If a userId is provided, ensure the user has access to this product's company.
  if (userId) {
    const user = await getUserById(userId);
    if (!user || (!user.roles.includes(UserRoles.ADMIN) && user.companyId !== product.companyId)) {
      return undefined; // Or throw a 403 error
    }
  }

  // Public access is only for published products.
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
  const { user, company } = await getCurrentUser(userId);

  const now = new Date().toISOString();
  let product: Product;

  if (productId) {
    // Update existing product
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
      // Ensure optional arrays are preserved if not in form values
      materials: values.materials || existingProduct.materials,
      certifications: values.certifications || existingProduct.certifications,
      packaging: values.packaging || existingProduct.packaging,
      manufacturing: values.manufacturing || existingProduct.manufacturing,
      verificationStatus: existingProduct.verificationStatus === 'Failed' ? 'Not Submitted' : existingProduct.verificationStatus
    };
    const index = mockProducts.findIndex(p => p.id === productId);
    mockProducts[index] = product;
    await logAuditEvent('product.updated', product.id, { changes: Object.keys(values) }, userId);
  } else {
    // Create new product
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
    mockProducts.push(product);
    await logAuditEvent('product.created', product.id, { productName: product.productName }, userId);
  }

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const { user } = await getCurrentUser(userId);
  const index = mockProducts.findIndex(
    p => p.id === productId && p.companyId === user.companyId,
  );
  if (index > -1) {
    const deletedProduct = mockProducts[index];
    mockProducts.splice(index, 1);
    await logAuditEvent('product.deleted', deletedProduct.id, { productName: deletedProduct.productName }, userId);
    revalidatePath('/dashboard', 'layout');
  } else {
    throw new Error('Product not found or access denied');
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  return mockUsers.find(user => user.id === id);
}

export async function createUserAndCompany(
  fullName: string,
  email: string,
  uid: string,
) {
  // 1. Create a new company for the user
  const newCompany: Company = {
    id: `comp-${randomBytes(2).toString('hex')}`,
    name: `${fullName}'s Company`,
    ownerId: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockCompanies.push(newCompany);

  // 2. Create the new user and assign them to the new company
  const newUser: User = {
    id: uid,
    fullName: fullName,
    email: email,
    companyId: newCompany.id,
    roles: [UserRoles.SUPPLIER], // Default role for new signups
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return mockCompliancePaths;
}

export async function getCompliancePathById(id: string): Promise<CompliancePath | undefined> {
  return mockCompliancePaths.find(p => p.id === id);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...mockAuditLogs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
    const logs = await getAuditLogs();
    return logs.filter(log => log.userId === userId);
}

export async function getCompanies(): Promise<Company[]> {
  return mockCompanies;
}

export async function logAuditEvent(action: string, entityId: string, details: Record<string, any>, userId: string) {
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

export async function markAllNotificationsAsRead(userId: string): Promise<User> {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  const allLogIds = mockAuditLogs.map(log => log.id);
  user.readNotificationIds = [...new Set([...(user.readNotificationIds || []), ...allLogIds])];
  user.updatedAt = new Date().toISOString();
  return user;
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
  revalidatePath('/dashboard/developer/keys');
  return { rawToken, apiKey: newKey };
}

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const key = mockApiKeys.find(k => k.id === id && k.userId === userId);
  if (!key) throw new Error('API Key not found or access denied');
  key.status = 'Revoked';
  key.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', key.id, {}, userId);
  revalidatePath('/dashboard/developer/keys');
  return key;
}

export async function deleteApiKey(id: string, userId: string): Promise<void> {
  const index = mockApiKeys.findIndex(k => k.id === id && k.userId === userId);
  if (index === -1) throw new Error('API Key not found or access denied');
  const deletedKey = mockApiKeys[index];
  mockApiKeys.splice(index, 1);
  await logAuditEvent('api_key.deleted', deletedKey.id, { label: deletedKey.label }, userId);
  revalidatePath('/dashboard/developer/keys');
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return mockProductionLines;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return mockServiceTickets;
}

export async function getApiSettings(): Promise<ApiSettings> {
  return mockApiSettings;
}

export async function saveApiSettings(values: ApiSettingsFormValues, userId: string): Promise<ApiSettings> {
  mockApiSettings.isPublicApiEnabled = values.isPublicApiEnabled;
  mockApiSettings.rateLimitPerMinute = Number(values.rateLimitPerMinute);
  mockApiSettings.isWebhookSigningEnabled = values.isWebhookSigningEnabled;
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  revalidatePath('/dashboard/admin/api-settings');
  revalidatePath('/dashboard/developer/api-settings');
  return mockApiSettings;
}

export async function approvePassport(productId: string, userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");

  const hash = await hashProductData(product);
  const [{ txHash, explorerUrl, blockHeight }, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, hash),
    generateEbsiCredential(productId)
  ]);

  product.verificationStatus = "Verified";
  product.status = "Published"; // Approving also publishes it
  product.blockchainProof = { txHash, explorerUrl, blockHeight };
  product.ebsiVcId = ebsiVcId;
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  
  await logAuditEvent('passport.approved', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function rejectPassport(productId: string, reason: string, gaps: ComplianceGap[], userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");

  product.verificationStatus = "Failed";
  product.sustainability = {
    ...product.sustainability!,
    isCompliant: false,
    complianceSummary: reason,
    gaps,
  };
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('passport.rejected', productId, { reason, gaps: gaps.length }, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function saveCompany(values: CompanyFormValues, userId: string, companyId?: string): Promise<Company> {
  const now = new Date().toISOString();
  if (companyId) {
    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) throw new Error("Company not found");
    company.name = values.name;
    company.ownerId = values.ownerId;
    company.updatedAt = now;
    await logAuditEvent('company.updated', companyId, { name: values.name }, userId);
    revalidatePath('/dashboard/admin/companies');
    return company;
  } else {
    const newCompany: Company = {
      id: `comp-${randomBytes(2).toString('hex')}`,
      name: values.name,
      ownerId: values.ownerId,
      createdAt: now,
      updatedAt: now,
    };
    mockCompanies.push(newCompany);
    await logAuditEvent('company.created', newCompany.id, { name: newCompany.name }, userId);
    revalidatePath('/dashboard/admin/companies');
    return newCompany;
  }
}

export async function deleteCompany(companyId: string, userId: string): Promise<void> {
  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index === -1) throw new Error("Company not found");
  const deletedCompany = mockCompanies[index];
  mockCompanies.splice(index, 1);
  await logAuditEvent('company.deleted', companyId, { name: deletedCompany.name }, userId);
  revalidatePath('/dashboard/admin/companies');
}

export async function saveCompliancePath(values: CompliancePathFormValues, userId: string, pathId?: string): Promise<CompliancePath> {
  const now = new Date().toISOString();
  const regulations = values.regulations.split(',').map(s => s.trim()).filter(Boolean);
  const requiredKeywords = values.requiredKeywords?.split(',').map(s => s.trim()).filter(Boolean);
  const bannedKeywords = values.bannedKeywords?.split(',').map(s => s.trim()).filter(Boolean);

  const pathData = {
    name: values.name,
    description: values.description,
    category: values.category,
    regulations,
    rules: {
      minSustainabilityScore: values.minSustainabilityScore ? Number(values.minSustainabilityScore) : undefined,
      requiredKeywords,
      bannedKeywords,
    },
  };

  if (pathId) {
    const path = mockCompliancePaths.find(p => p.id === pathId);
    if (!path) throw new Error("Compliance path not found");
    Object.assign(path, pathData, { updatedAt: now });
    await logAuditEvent('compliance_path.updated', pathId, { name: path.name }, userId);
    revalidatePath('/dashboard/admin/compliance');
    return path;
  } else {
    const newPath: CompliancePath = {
      id: `cp-${randomBytes(3).toString('hex')}`,
      ...pathData,
      createdAt: now,
      updatedAt: now,
    };
    mockCompliancePaths.push(newPath);
    await logAuditEvent('compliance_path.created', newPath.id, { name: newPath.name }, userId);
    revalidatePath('/dashboard/admin/compliance');
    return newPath;
  }
}

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const products = await getProducts(); 
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  } else {
    const headers = Object.keys(products[0] || {}).join(',');
    const rows = products.map(product => {
      return Object.values(product).map(value => {
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      }).join(',');
    });
    return [headers, ...rows].join('\n');
  }
}

export async function markAsRecycled(productId: string, userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");
  product.endOfLifeStatus = "Recycled";
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/recycler/eol');
  return product;
}

export async function resolveComplianceIssue(productId: string, userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");
  if (product.verificationStatus !== "Failed") throw new Error("Product is not in a failed state.");
  
  product.verificationStatus = "Not Submitted";
  product.status = "Draft";
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);

  revalidatePath('/dashboard/compliance-manager/flagged');
  return product;
}

export async function submitForReview(productId: string, userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");
  
  product.verificationStatus = "Pending";
  product.updatedAt = new Date().toISOString();
  product.lastUpdated = new Date().toISOString();

  await logAuditEvent('passport.submitted', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function recalculateScore(productId: string, userId: string): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");

  product.sustainability = undefined;
  product.qrLabelText = undefined;
  product.dataQualityWarnings = undefined;
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  revalidatePath('/dashboard', 'layout');

  return product;
}

export async function updateUserProfile(userId: string, fullName: string): Promise<User> {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  user.fullName = fullName;
  user.updatedAt = new Date().toISOString();
  await logAuditEvent('user.profile.updated', userId, { name: fullName }, userId);
  revalidatePath('/dashboard/settings');
  return user;
}

export async function updateUserPassword(userId: string, current: string, newPass: string): Promise<void> {
  if (current !== 'password123') {
    throw new Error("Incorrect current password.");
  }
  await logAuditEvent('user.password.updated', userId, {}, userId);
  console.log(`Password for user ${userId} updated to ${newPass}`);
}

export async function saveNotificationPreferences(userId: string, prefs: any): Promise<void> {
  await logAuditEvent('user.notifications.updated', userId, { prefs }, userId);
  console.log(`Notification preferences for user ${userId} saved:`, prefs);
}

export async function saveUser(values: UserFormValues, adminUserId: string, userId?: string): Promise<User> {
  const now = new Date().toISOString();
  if (userId) {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    user.fullName = values.fullName;
    user.email = values.email;
    user.companyId = values.companyId;
    user.roles = [values.role];
    user.updatedAt = now;
    await logAuditEvent('user.updated', userId, { values }, adminUserId);
    revalidatePath('/dashboard/admin/users');
    return user;
  } else {
    const newUser: User = {
      id: `user-${randomBytes(3).toString('hex')}`,
      ...values,
      roles: [values.role],
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.push(newUser);
    await logAuditEvent('user.created', newUser.id, { values }, adminUserId);
    revalidatePath('/dashboard/admin/users');
    return newUser;
  }
}

export async function deleteUser(userId: string, adminUserId: string): Promise<void> {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index === -1) throw new Error("User not found");
  const deletedUser = mockUsers[index];
  mockUsers.splice(index, 1);
  await logAuditEvent('user.deleted', userId, { email: deletedUser.email }, adminUserId);
  revalidatePath('/dashboard/admin/users');
}

export async function runSuggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovements({
    productName: input.productName,
    productDescription: input.productDescription,
  });
}
