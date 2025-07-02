// src/app/dashboard/admin/products/page.tsx
import { redirect } from 'next/navigation';
import ProductManagementClient from '@/components/product-management-client';
import { getCompliancePaths } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

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

  // Products are now fetched on the client side with a real-time listener.
  const compliancePaths = await getCompliancePaths();

  return (
    <ProductManagementClient user={user} compliancePaths={compliancePaths} />
  );
}
