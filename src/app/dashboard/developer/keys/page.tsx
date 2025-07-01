// src/app/dashboard/developer/keys/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import ApiKeysClient from '@/components/api-keys-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Initial API keys are now fetched on the client side with a real-time listener.
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
        <ApiKeysClient user={user} />
      </CardContent>
    </Card>
  );
}
