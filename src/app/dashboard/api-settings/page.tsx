// src/app/dashboard/api-settings/page.tsx
import { redirect } from 'next/navigation';
import { getApiSettings } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import ApiSettingsClient from '@/components/api-settings-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ApiSettingsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  const allowedRoles: Role[] = [UserRoles.ADMIN, UserRoles.DEVELOPER];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect('/dashboard');
  }

  const settings = await getApiSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for the Norruva API and integrations.
        </p>
      </div>
      <ApiSettingsClient initialSettings={settings} user={user} />
    </div>
  );
}
