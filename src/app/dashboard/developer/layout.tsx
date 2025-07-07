// src/app/dashboard/developer/layout.tsx
import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import DeveloperLayoutClient from '@/components/developer-layout-client';

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  return (
    <DeveloperLayoutClient user={user}>
      {children}
    </DeveloperLayoutClient>
  );
}
