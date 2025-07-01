// src/app/dashboard/retailer/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function RetailerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.RETAILER);

  return (
    <DashboardShell user={user} role={UserRoles.RETAILER}>
      {children}
    </DashboardShell>
  );
}
