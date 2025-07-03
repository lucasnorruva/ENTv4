// src/lib/data-actions.ts
// This file is intended to hold direct data access logic.
// In a real app, this would be where you interact with your database (e.g., Firebase Firestore).
// For the mock implementation, it accesses the in-memory data arrays.

'use server';

import { products as mockProducts } from './data';
import type { Product, User } from './types';
import { getUserById } from './auth';
import { hasRole } from './auth-utils';
import { UserRoles, type Role } from './constants';

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
