// src/app/dashboard/keys/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getApiKeysForUser } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import ApiKeysClient from '@/components/api-keys-client';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const user = await getCurrentUser('Developer');
  const apiKeys = await getApiKeysForUser(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage API keys for accessing the Norruva API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeysClient initialApiKeys={apiKeys} user={user} />
      </CardContent>
    </Card>
  );
}
