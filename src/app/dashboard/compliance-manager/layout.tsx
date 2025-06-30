// src/app/dashboard/compliance-manager/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function ComplianceManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);

  return (
    <DashboardShell user={user} role={UserRoles.COMPLIANCE_MANAGER}>
      {children}
    </DashboardShell>
  );
}
