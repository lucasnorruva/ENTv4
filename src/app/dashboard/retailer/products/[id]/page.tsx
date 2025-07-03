// src/app/dashboard/retailer/products/[id]/page.tsx
import {
  getProductById,
  getCompliancePathById,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import PublicPassportView from '@/components/public-passport-view';
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

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : undefined;

  return (
    <div className="space-y-4">
       <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/retailer/catalog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Link>
      </Button>
      <PublicPassportView product={product} compliancePath={compliancePath} />
    </div>
  );
}
