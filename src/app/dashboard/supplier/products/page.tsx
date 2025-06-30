// src/app/dashboard/supplier/products/page.tsx
import { redirect } from 'next/navigation';
import ProductManagement from '@/components/product-management';
import { getProducts, getCompliancePaths } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

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

  const [initialProducts, compliancePaths] = await Promise.all([
    getProducts(user.id),
    getCompliancePaths(),
  ]);

  return (
    <ProductManagement
      initialProducts={initialProducts}
      user={user}
      compliancePaths={compliancePaths}
    />
  );
}
