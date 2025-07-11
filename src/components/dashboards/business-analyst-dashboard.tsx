// src/components/dashboards/business-analyst-dashboard.tsx
import type { User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import BusinessAnalystDashboardClient from './business-analyst-dashboard-client';

export default async function BusinessAnalystDashboard({
  user,
}: {
  user: User;
}) {
  // Business Analysts can see all products.
  const products = await getProducts();
  
  const complianceData = {
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    failed: products.filter(p => p.verificationStatus === 'Failed').length,
  };

  const categoryScores = products.reduce(
    (acc, product) => {
      if (product.sustainability?.score !== undefined) {
        if (!acc[product.category]) {
          acc[product.category] = { totalScore: 0, count: 0 };
        }
        acc[product.category].totalScore += product.sustainability.score;
        acc[product.category].count++;
      }
      return acc;
    },
    {} as Record<string, { totalScore: number; count: number }>,
  );

  const sustainabilityByCategoryData = Object.entries(categoryScores).map(
    ([category, data]) => ({
      category,
      averageScore:
        data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    }),
  );

  return (
    <BusinessAnalystDashboardClient
      user={user}
      complianceData={complianceData}
      sustainabilityByCategoryData={sustainabilityByCategoryData}
    />
  );
}
