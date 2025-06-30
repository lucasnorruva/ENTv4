// src/app/dashboard/eol/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import EolProductsClient from '@/components/eol-products-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function EolPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.RECYCLER)) {
    redirect('/dashboard');
  }

  const products = await getProducts(user.id);
  return <EolProductsClient initialProducts={products} user={user} />;
}
