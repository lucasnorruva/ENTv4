// src/app/dashboard/developer/integrations/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import IntegrationManagementClient from '@/components/integration-management-client';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  const allowedRoles = [UserRoles.ADMIN, UserRoles.DEVELOPER];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Norruva with your existing enterprise systems to automate
          data flows.
        </p>
      </div>
      <IntegrationManagementClient user={user} />
    </div>
  );
}
