// src/app/dashboard/manufacturer/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function ManufacturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);

  return (
    <DashboardShell user={user} role={UserRoles.MANUFACTURER}>
      {children}
    </DashboardShell>
  );
}
