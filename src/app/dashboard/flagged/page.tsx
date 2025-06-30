// src/app/dashboard/flagged/page.tsx
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import FlaggedProductsClient from '@/components/flagged-products-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.COMPLIANCE_MANAGER)) {
    redirect('/dashboard');
  }

  const allProducts = await getProducts(user.id);

  const flaggedProducts = allProducts.filter(
    p => p.verificationStatus === 'Failed',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Products Queue</CardTitle>
        <CardDescription>
          Review and manage products that have failed compliance verification.
          Resolving an issue sends it back to the supplier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FlaggedProductsClient initialProducts={flaggedProducts} user={user} />
      </CardContent>
    </Card>
  );
}
