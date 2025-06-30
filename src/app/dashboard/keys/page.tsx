// src/app/dashboard/keys/page.tsx
import { getApiKeys } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import ApiKeysClient from '@/components/api-keys-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const user = await getCurrentUser('Developer');
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
