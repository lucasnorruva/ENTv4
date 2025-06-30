// src/app/dashboard/keys/page.tsx
import { redirect } from 'next/navigation';
import { getApiKeys } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import ApiKeysClient from '@/components/api-keys-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect('/dashboard');
  }

  const apiKeys = await getApiKeys(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage API keys for accessing the Norruva API. Use these keys for
          server-to-server integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeysClient initialApiKeys={apiKeys} user={user} />
      </CardContent>
    </Card>
  );
}
