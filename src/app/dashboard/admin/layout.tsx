// src/app/dashboard/admin/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.ADMIN);

  return (
    <DashboardShell user={user} role={UserRoles.ADMIN}>
      {children}
    </DashboardShell>
  );
}
