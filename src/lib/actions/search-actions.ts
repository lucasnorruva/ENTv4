// src/lib/actions/search-actions.ts
'use server';

import type { Product, User, CompliancePath } from '@/types';
import { getUserById, getUsers } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import { getProducts } from './product-actions';
import { getCompliancePaths } from './compliance-actions';

export async function globalSearch(
  query: string,
  userId: string,
): Promise<{
  products: Product[];
  users: User[];
  compliancePaths: CompliancePath[];
}> {
  const user = await getUserById(userId);
  if (!user) return { products: [], users: [], compliancePaths: [] };

  const lowerCaseQuery = query.toLowerCase();

  const products = await getProducts(userId, { searchQuery: query });

  let users: User[] = [];
  let compliancePaths: CompliancePath[] = [];

  if (hasRole(user, UserRoles.ADMIN)) {
    const allUsers = await getUsers();
    users = allUsers.filter(
      u =>
        u.fullName.toLowerCase().includes(lowerCaseQuery) ||
        u.email.toLowerCase().includes(lowerCaseQuery),
    );

    const allPaths = await getCompliancePaths();
    compliancePaths = allPaths.filter(p =>
      p.name.toLowerCase().includes(lowerCaseQuery),
    );
  }

  return {
    products: products.slice(0, 5),
    users: users.slice(0, 5),
    compliancePaths: compliancePaths.slice(0, 5),
  };
}
