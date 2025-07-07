// src/app/dashboard/developer/explorer/page.tsx
'use server';

import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ApiExplorerClient from '@/components/api-explorer-client';

export default async function ApiExplorerPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);
  return <ApiExplorerClient user={user} />;
}
