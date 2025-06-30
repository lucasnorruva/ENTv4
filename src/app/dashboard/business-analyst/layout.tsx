// src/app/dashboard/business-analyst/layout.tsx
import React from 'react';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export default async function BusinessAnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.BUSINESS_ANALYST);

  return (
    <DashboardShell user={user} role={UserRoles.BUSINESS_ANALYST}>
      {children}
    </DashboardShell>
  );
}
