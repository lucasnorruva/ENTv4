// src/app/dashboard/manufacturer/products/page.tsx
import { redirect } from 'next/navigation';
import ProductManagement from '@/components/product-management';
import { getCompliancePaths, getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);

  const allowedRoles = [
    UserRoles.ADMIN,
    UserRoles.SUPPLIER,
    UserRoles.AUDITOR,
    UserRoles.MANUFACTURER,
    UserRoles.COMPLIANCE_MANAGER,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [products, compliancePaths] = await Promise.all([
    getProducts(user.id),
    getCompliancePaths(),
  ]);

  return (
    <ProductManagement
      initialProducts={products}
      user={user}
      compliancePaths={compliancePaths}
    />
  );
}
