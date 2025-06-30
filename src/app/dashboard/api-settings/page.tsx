// src/app/dashboard/api-settings/page.tsx
import { getApiSettings } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import ApiSettingsClient from '@/components/api-settings-client';

export const dynamic = 'force-dynamic';

export default async function ApiSettingsPage() {
  const [settings, user] = await Promise.all([
    getApiSettings(),
    getCurrentUser('Admin'),
  ]);

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
