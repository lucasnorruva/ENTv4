// src/app/dashboard/retailer/products/[id]/page.tsx
import {
  getProductById,
  getCompliancePathById,
  getAuditLogsForEntity,
} from '@/lib/actions';
import { getCurrentUser, getCompanyById, getUsers } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductDetailView from '@/components/product-detail-view';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.RETAILER);
  const product = await getProductById(params.id, user.id);

  if (!product) {
    notFound();
  }

  // Fetch audit logs and compliance path for the full detail view
  const [compliancePath, auditLogs, allUsers, company] = await Promise.all([
    product.compliancePathId
      ? getCompliancePathById(product.compliancePathId)
      : undefined,
    getAuditLogsForEntity(product.id),
    getUsers(),
    getCompanyById(product.companyId),
  ]);

  const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/retailer/catalog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Link>
      </Button>
      {/* Use the full-featured ProductDetailView */}
      <ProductDetailView
        product={product}
        user={user}
        compliancePath={compliancePath}
        auditLogs={auditLogs}
        userMap={userMap}
        company={company}
      />
    </div>
  );
}
