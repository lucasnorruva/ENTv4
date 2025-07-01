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
  serviceTicketFormSchema,
  ServiceTicketFormValues,
} from './schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { UserRoles, type Role } from './constants';
import { getUserById, getCompanyById } from './auth';
import { hasRole } from './auth-utils';

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

// Helper for mock data manipulation
const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  if (!userId) {
    return Promise.resolve(mockProducts);
  }

  const user = await getUserById(userId);
  if (!user) return [];

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.RETAILER,
  ];
  const hasGlobalRead = globalReadRoles.some(role => hasRole(user, role));

  if (hasGlobalRead) {
    return Promise.resolve(mockProducts);
  }
  
  return Promise.resolve(mockProducts.filter(p => p.companyId === user.companyId));
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
    UserRoles.ADMIN, UserRoles.AUDITOR, UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER, UserRoles.SERVICE_PROVIDER, UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER, UserRoles.MANUFACTURER, UserRoles.RETAILER,
  ];

  const hasGlobalReadAccess = globalReadRoles.some(role => hasRole(user, role));

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
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found');
    const existingProduct = mockProducts[productIndex];
    
    if (existingProduct.companyId !== user.companyId && !hasRole(user, UserRoles.ADMIN)) {
      throw new Error('Permission denied to edit this product.');
    }
    
    savedProduct = {
      ...existingProduct,
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
    };
    mockProducts[productIndex] = savedProduct;
    await logAuditEvent('product.updated', productId, { changes: Object.keys(values) }, userId);
  } else {
    const company = await getCompanyById(user.companyId);
    if (!company) throw new Error(`Company with ID ${user.companyId} not found.`);

    savedProduct = {
      id: newId('pp'),
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage: validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
    };
    mockProducts.unshift(savedProduct); // Add to beginning of array
    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  return Promise.resolve(savedProduct);
}

export async function deleteProduct(productId: string, userId: string): Promise<void> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex > -1) {
    mockProducts.splice(productIndex, 1);
    await logAuditEvent('product.deleted', productId, {}, userId);
  }
  return Promise.resolve();
}

export async function submitForReview(productId: string, userId: string): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  
  mockProducts[productIndex].verificationStatus = 'Pending';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);
  
  return Promise.resolve(mockProducts[productIndex]);
}

export async function recalculateScore(productId: string, userId: string): Promise<void> {
  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  console.log(`Mock recalculating score for ${productId}. In a real app, this would trigger a background job.`);
  return Promise.resolve();
}

export async function approvePassport(productId: string, userId: string): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  const productHash = await hashProductData(product);
  const blockchainProof = await anchorToPolygon(product.id, productHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  mockProducts[productIndex] = {
    ...product,
    verificationStatus: 'Verified',
    status: 'Published',
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    ebsiVcId,
  };
  
  await logAuditEvent('passport.approved', productId, { txHash: blockchainProof.txHash }, userId);
  return Promise.resolve(mockProducts[productIndex]);
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
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
    }
  };

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  return Promise.resolve(mockProducts[productIndex]);
}

export async function markAsRecycled(productId: string, userId: string): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  
  mockProducts[productIndex].endOfLifeStatus = 'Recycled';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  
  return Promise.resolve(mockProducts[productIndex]);
}

export async function resolveComplianceIssue(productId: string, userId: string): Promise<Product> {
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

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  return Promise.resolve(mockCompanies);
}

export async function saveCompany(values: CompanyFormValues, userId: string, companyId?: string): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedCompany: Company;

  if (companyId) {
    const companyIndex = mockCompanies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) throw new Error('Company not found');
    savedCompany = { ...mockCompanies[companyIndex], ...validatedData, updatedAt: now };
    mockCompanies[companyIndex] = savedCompany;
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    savedCompany = { id: newId('comp'), ...validatedData, createdAt: now, updatedAt: now };
    mockCompanies.push(savedCompany);
    await logAuditEvent('company.created', savedCompany.id, {}, userId);
  }
  return Promise.resolve(savedCompany);
}

export async function deleteCompany(companyId: string, userId: string): Promise<void> {
    const index = mockCompanies.findIndex(c => c.id === companyId);
    if(index > -1) {
        mockCompanies.splice(index, 1);
        await logAuditEvent('company.deleted', companyId, {}, userId);
    }
    return Promise.resolve();
}


export async function saveUser(values: UserFormValues, adminId: string, userId?: string): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedUser: User;
  
  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    savedUser = { ...mockUsers[userIndex], ...userData };
    mockUsers[userIndex] = savedUser;
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    savedUser = { id: newId('user'), ...userData, createdAt: now, readNotificationIds: [] };
    mockUsers.push(savedUser);
    await logAuditEvent('user.created', savedUser.id, {}, adminId);
  }
  return Promise.resolve(savedUser);
}


export async function deleteUser(userId: string, adminId: string): Promise<void> {
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

export async function getCompliancePathById(id: string): Promise<CompliancePath | undefined> {
  return Promise.resolve(mockCompliancePaths.find(p => p.id === id));
}

export async function saveCompliancePath(values: CompliancePathFormValues, userId: string, pathId?: string): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(values);
  const now = new Date().toISOString();
  
  const pathData = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations.split(',').map(s => s.trim()).filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords?.split(',').map(s => s.trim()).filter(Boolean),
      bannedKeywords: validatedData.bannedKeywords?.split(',').map(s => s.trim()).filter(Boolean),
    },
    updatedAt: now,
  };
  
  let savedPath: CompliancePath;

  if (pathId) {
    const pathIndex = mockCompliancePaths.findIndex(p => p.id === pathId);
    if(pathIndex === -1) throw new Error("Path not found");
    savedPath = { ...mockCompliancePaths[pathIndex], ...pathData };
    mockCompliancePaths[pathIndex] = savedPath;
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    savedPath = { id: newId('cp'), ...pathData, createdAt: now };
    mockCompliancePaths.push(savedPath);
    await logAuditEvent('compliance_path.created', savedPath.id, {}, userId);
  }
  return Promise.resolve(savedPath);
}

export async function deleteCompliancePath(pathId: string, userId: string): Promise<void> {
    const index = mockCompliancePaths.findIndex(p => p.id === pathId);
    if (index > -1) {
        mockCompliancePaths.splice(index, 1);
        await logAuditEvent('compliance_path.deleted', pathId, {}, userId);
    }
    return Promise.resolve();
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return Promise.resolve(mockAuditLogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const logs = mockAuditLogs.filter(log => log.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return Promise.resolve(logs);
}

export async function logAuditEvent(action: string, entityId: string, details: Record<string, any>, userId: string): Promise<AuditLog> {
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
    return Promise.resolve(mockApiKeys.filter(k => k.userId === userId));
}

export async function createApiKey(label: string, userId: string): Promise<{ key: ApiKey; rawToken: string }> {
  const now = new Date().toISOString();
  const rawToken = `nor_mock_${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const newKey: ApiKey = {
    id: newId('key'),
    label,
    token: `nor_mock_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: now,
    updatedAt: now,
  };
  mockApiKeys.push(newKey);
  await logAuditEvent('api_key.created', newKey.id, { label }, userId);
  return Promise.resolve({ key: newKey, rawToken });
}

export async function revokeApiKey(keyId: string, userId: string): Promise<ApiKey> {
    const keyIndex = mockApiKeys.findIndex(k => k.id === keyId && k.userId === userId);
    if (keyIndex === -1) throw new Error("API Key not found or permission denied.");
    mockApiKeys[keyIndex].status = "Revoked";
    mockApiKeys[keyIndex].updatedAt = new Date().toISOString();
    await logAuditEvent('api_key.revoked', keyId, {}, userId);
    return Promise.resolve(mockApiKeys[keyIndex]);
}

export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
    const index = mockApiKeys.findIndex(k => k.id === keyId && k.userId === userId);
    if (index > -1) {
        mockApiKeys.splice(index, 1);
        await logAuditEvent('api_key.deleted', keyId, {}, userId);
    }
    return Promise.resolve();
}


export async function getApiSettings(): Promise<ApiSettings> {
  return Promise.resolve(mockApiSettings);
}

export async function saveApiSettings(values: ApiSettingsFormValues, userId: string): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(values);
  Object.assign(mockApiSettings, validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return Promise.resolve(mockApiSettings);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  user.readNotificationIds = mockAuditLogs.map(log => log.id);
  return Promise.resolve();
}

export async function createUserAndCompany(name: string, email: string, userId: string) {
  const now = new Date().toISOString();
  const newCompany: Company = {
    id: newId('comp'),
    name: `${name}'s Company`,
    ownerId: userId,
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
  };
  mockUsers.push(newUser);
  return Promise.resolve();
}

export async function updateUserProfile(userId: string, fullName: string) {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.fullName = fullName;
  }
  return Promise.resolve();
}

export async function updateUserPassword(userId: string, current: string, newPass: string) {
  if (current !== 'password123') throw new Error('Incorrect current password.');
  console.log(`Password for user ${userId} has been updated in mock environment.`);
  return Promise.resolve();
}

export async function saveNotificationPreferences(userId: string, prefs: any) {
  console.log(`Saving notification preferences for ${userId}`, prefs);
  return Promise.resolve();
}

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }

  if (products.length === 0) return '';
  const headers = Object.keys(products[0]).join(',');
  const rows = products.map(product => {
    return Object.values(product).map(value => {
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return value;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return Promise.resolve(mockServiceTickets);
}

export async function saveServiceTicket(values: ServiceTicketFormValues, userId: string, ticketId?: string): Promise<ServiceTicket> {
  const validatedData = serviceTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedTicket: ServiceTicket;

  if (ticketId) {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if(ticketIndex === -1) throw new Error("Ticket not found");
    savedTicket = { ...mockServiceTickets[ticketIndex], ...validatedData, updatedAt: now };
    mockServiceTickets[ticketIndex] = savedTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = { id: newId('tkt'), ...validatedData, userId, createdAt: now, updatedAt: now };
    mockServiceTickets.unshift(savedTicket);
    await logAuditEvent('ticket.created', savedTicket.id, {}, userId);
  }
  return Promise.resolve(savedTicket);
}

export async function updateServiceTicketStatus(ticketId: string, status: 'Open' | 'In Progress' | 'Closed', userId: string): Promise<ServiceTicket> {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if(ticketIndex === -1) throw new Error("Ticket not found");
    mockServiceTickets[ticketIndex].status = status;
    mockServiceTickets[ticketIndex].updatedAt = new Date().toISOString();
    await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
    return Promise.resolve(mockServiceTickets[ticketIndex]);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return Promise.resolve(mockProductionLines);
}
