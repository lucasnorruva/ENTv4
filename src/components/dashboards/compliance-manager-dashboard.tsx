// src/components/dashboards/compliance-manager-dashboard.tsx
import { getProducts } from '@/lib/actions/product-actions';
import type { User } from '@/types';
import ComplianceManagerDashboardClient from './compliance-manager-dashboard-client';

export default async function ComplianceManagerDashboard({
  user,
}: {
  user: User;
}) {
  const allProducts = await getProducts(user.id);
  const flaggedProducts = allProducts.filter(
    p => p.verificationStatus === 'Failed',
  );

  const gapCounts = new Map<string, number>();
  flaggedProducts.forEach(product => {
    product.sustainability?.gaps?.forEach(gap => {
      const key = `${gap.regulation}: ${gap.issue}`;
      gapCounts.set(key, (gapCounts.get(key) || 0) + 1);
    });
  });

  const commonGaps = Array.from(gapCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  return (
    <ComplianceManagerDashboardClient
      user={user}
      flaggedProducts={flaggedProducts}
      commonGaps={commonGaps}
    />
  );
}
