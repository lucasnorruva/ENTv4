// src/app/dashboard/developer/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  return (
    <DashboardShell user={user} role={UserRoles.DEVELOPER}>
      {children}
    </DashboardShell>
  );
}
