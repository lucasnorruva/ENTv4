// src/app/dashboard/supplier/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

  return (
    <DashboardShell user={user} role={UserRoles.SUPPLIER}>
      {children}
    </DashboardShell>
  );
}
