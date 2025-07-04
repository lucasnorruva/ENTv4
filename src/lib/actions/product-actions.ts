// src/lib/actions/product-actions.ts
'use server';

import type { Product, User } from '@/types';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { UserRoles, type Role } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { processProductAi } from './product-ai-actions';
import { products as mockProducts } from '../data';


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

  if (!userId) {
    // Public access: only published products
    results = results.filter(p => p.status === 'Published');
  } else {
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
    if (!hasGlobalRead) {
      results = results.filter(p => p.companyId === user!.companyId);
    }
  }

  // In-memory filtering after fetching
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.gtin?.toLowerCase().includes(q),
    );
  }
  if (filters?.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters?.verificationStatus) {
    results = results.filter(
      p => (p.verificationStatus ?? 'Not Submitted') === filters.verificationStatus,
    );
  }
  
  results.sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return Promise.resolve(results);
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

export async function getProductByGtin(
  gtin: string,
  userId: string,
): Promise<Product | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;

  let results = mockProducts.filter(p => p.gtin === gtin);

  // Admins and developers can search across all companies
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
  let productRef: string; // Using ID as ref for mock data

  if (productId) {
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if(productIndex === -1) throw new Error('Product not found');
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
    
    savedProduct = { ...existingProduct, ...updatedData };
    mockProducts[productIndex] = savedProduct;
    productRef = productId;

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
    };
    const newIdVal = newId('pp');
    savedProduct = { id: newIdVal, ...newProductData };
    productRef = newIdVal;
    mockProducts.unshift(savedProduct);

    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  // Simulate background AI processing
  setTimeout(async () => {
    try {
      const { sustainability, qrLabelText, dataQualityWarnings } =
        await processProductAi(savedProduct);
      const productIndex = mockProducts.findIndex(p => p.id === savedProduct.id);
      if (productIndex !== -1) {
        mockProducts[productIndex].sustainability = sustainability;
        mockProducts[productIndex].qrLabelText = qrLabelText;
        mockProducts[productIndex].dataQualityWarnings = dataQualityWarnings;
        mockProducts[productIndex].isProcessing = false;
        mockProducts[productIndex].lastUpdated = new Date().toISOString();
      }
    } catch (e) {
      console.error(
        `Background AI processing failed for product ${savedProduct.id}`,
        e,
      );
      const productIndex = mockProducts.findIndex(p => p.id === savedProduct.id);
      if (productIndex !== -1) {
        mockProducts[productIndex].isProcessing = false;
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
