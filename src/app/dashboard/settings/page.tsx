// src/app/dashboard/settings/page.tsx
import { getCurrentUser } from '@/lib/auth';
import SettingsClient from '@/components/settings-client';
import type { Role } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const role = searchParams.role || 'Supplier';
  const user = await getCurrentUser(role);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <SettingsClient user={user} />
    </div>
  );
}
