// src/app/dashboard/recycler/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function RecyclerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.RECYCLER);

  return (
    <DashboardShell user={user} role={UserRoles.RECYCLER}>
      {children}
    </DashboardShell>
  );
}
