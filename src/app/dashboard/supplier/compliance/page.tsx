// src/app/dashboard/supplier/compliance/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import SupplierComplianceReport from '@/components/supplier-compliance-report';

export const dynamic = 'force-dynamic';

export default async function SupplierCompliancePage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

  if (!hasRole(user, UserRoles.SUPPLIER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const products = await getProducts(user.id);

  return <SupplierComplianceReport initialProducts={products} />;
}
