// src/app/dashboard/manufacturer/products/page.tsx
import { redirect } from 'next/navigation';
import ProductManagementClient from '@/components/product-management-client';
import { getProducts } from '@/lib/actions/product-actions';
import { getCompliancePaths } from '@/lib/actions/compliance-actions';
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

  // Fetch initial products on the server.
  const initialProducts = await getProducts(user.id);
  const compliancePaths = await getCompliancePaths();

  return (
    <ProductManagementClient
      user={user}
      initialProducts={initialProducts}
      compliancePaths={compliancePaths}
    />
  );
}
