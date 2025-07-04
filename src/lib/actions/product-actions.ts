// src/lib/actions/product-actions.ts
'use server';

import type { Product, User } from '@/types';
import {
  productFormSchema,
  type ProductFormValues,
} from '@/lib/schemas';
import { products as mockProducts } from '@/lib/data';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { UserRoles, type Role } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { processProductAi } from './product-ai-actions';

// --- Core CRUD Actions ---

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
