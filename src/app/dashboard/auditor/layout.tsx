// src/app/dashboard/auditor/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function AuditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  return (
    <DashboardShell user={user} role={UserRoles.AUDITOR}>
      {children}
    </DashboardShell>
  );
}
