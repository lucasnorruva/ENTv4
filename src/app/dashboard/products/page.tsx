// src/app/dashboard/products/page.tsx
import { redirect } from 'next/navigation';
import ProductManagement from '@/components/product-management';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  const allowedRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.SUPPLIER,
    UserRoles.AUDITOR,
    UserRoles.MANUFACTURER,
    UserRoles.COMPLIANCE_MANAGER,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect('/dashboard');
  }

  const initialProducts = await getProducts(user.id);

  return <ProductManagement initialProducts={initialProducts} user={user} />;
}
