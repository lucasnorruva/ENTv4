// src/app/dashboard/flagged/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import FlaggedProductsClient from '@/components/flagged-products-client';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage() {
  const user = await getCurrentUser('Compliance Manager');
  const allProducts = await getProducts(user.id);
  
  const flaggedProducts = allProducts.filter(
    p => p.verificationStatus === 'Failed',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Products Queue</CardTitle>
        <CardDescription>
          Review and manage products that have failed compliance verification. Resolving an issue sends it back to the supplier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FlaggedProductsClient initialProducts={flaggedProducts} user={user} />
      </CardContent>
    </Card>
  );
}
