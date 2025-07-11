// src/app/dashboard/auditor/audit/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  if (!hasRole(user, UserRoles.AUDITOR)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Data fetching is now handled client-side with a real-time listener
  return <AuditQueueClient user={user} />;
}
