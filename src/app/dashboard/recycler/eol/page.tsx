// src/app/dashboard/recycler/eol/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import ProductScanner from '@/components/product-scanner';

export const dynamic = 'force-dynamic';

export default async function EolPage() {
  const user = await getCurrentUser(UserRoles.RECYCLER);

  if (!hasRole(user, UserRoles.RECYCLER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          End-of-Life Processing
        </h1>
        <p className="text-muted-foreground">
          Scan or enter product IDs to process items for recycling.
        </p>
      </div>
      <ProductScanner user={user} />
    </div>
  );
}
