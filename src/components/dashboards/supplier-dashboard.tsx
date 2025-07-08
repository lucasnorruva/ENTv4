// src/components/dashboards/supplier-dashboard.tsx
import type { User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import SupplierDashboardClient from './supplier-dashboard-client';

export default async function SupplierDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    total: products.length,
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    failed: products.filter(p => p.verificationStatus === 'Failed').length,
    needsAction: products.filter(
      p => p.status === 'Draft' || p.verificationStatus === 'Failed',
    ).length,
  };

  const complianceData = {
    verified: stats.verified,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    failed: stats.failed,
  };

  const productsNeedingAttention = products
    .filter(
      p =>
        p.status === 'Draft' ||
        p.verificationStatus === 'Failed' ||
        (p.dataQualityWarnings && p.dataQualityWarnings.length > 0),
    )
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    )
    .slice(0, 5);

  return (
    <SupplierDashboardClient
      user={user}
      stats={stats}
      complianceData={complianceData}
      productsNeedingAttention={productsNeedingAttention}
    />
  );
}
