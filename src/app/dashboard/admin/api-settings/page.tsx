// src/app/dashboard/admin/api-settings/page.tsx
import { redirect } from 'next/navigation';
import { getApiSettings } from '@/lib/actions/settings-actions';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import ApiSettingsClient from '@/components/api-settings-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ApiSettingsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  const allowedRoles = [UserRoles.ADMIN, UserRoles.DEVELOPER];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
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
