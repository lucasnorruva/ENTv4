// src/app/dashboard/supplier/data-quality/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import SupplierDataQualityReport from '@/components/supplier-data-quality-report';

export const dynamic = 'force-dynamic';

export default async function SupplierDataQualityPage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

  if (!hasRole(user, UserRoles.SUPPLIER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const products = await getProducts(user.id);
  const productsWithWarnings = products.filter(
    p => p.dataQualityWarnings && p.dataQualityWarnings.length > 0
  );

  return <SupplierDataQualityReport products={productsWithWarnings} />;
}
