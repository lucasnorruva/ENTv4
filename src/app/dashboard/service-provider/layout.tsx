// src/app/dashboard/service-provider/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function ServiceProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);

  return (
    <DashboardShell user={user} role={UserRoles.SERVICE_PROVIDER}>
      {children}
    </DashboardShell>
  );
}
