// src/app/dashboard/auditor/inspection/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import CustomsInspectionClient from '@/components/customs-inspection-client';

export const dynamic = 'force-dynamic';

export default async function BorderInspectionPage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  if (!hasRole(user, UserRoles.AUDITOR)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Border Inspection
        </h1>
        <p className="text-muted-foreground">
          Look up a product by its ID to record a customs inspection event.
        </p>
      </div>
      <CustomsInspectionClient user={user} />
    </div>
  );
}
