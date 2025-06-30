
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

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...mockAuditLogs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
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

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return mockApiKeys.filter(key => key.userId === userId);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return mockProductionLines;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return mockServiceTickets;
}

export async function runSuggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovements({
    productName: input.productName,
    productDescription: input.productDescription,
  });
}
