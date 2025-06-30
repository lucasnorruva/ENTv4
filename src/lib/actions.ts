// src/lib/actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
import { randomBytes } from 'crypto';
import type { Product, User } from './types';
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { UserRoles } from './constants';

export async function getProducts(): Promise<Product[]> {
  // In a real app, you'd fetch from a database.
  // Here, we're returning the mock data.
  return Promise.resolve(mockProducts);
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (product?.status === 'Published') {
    return Promise.resolve(product);
  }
  return Promise.resolve(undefined);
}

export async function createUserAndCompany(
  fullName: string,
  email: string,
  uid: string,
) {
  const newCompany = {
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
