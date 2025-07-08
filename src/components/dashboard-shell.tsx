// src/components/dashboard-shell.tsx
import React from 'react';
import type { User } from '@/types';
import type { Role } from '@/lib/constants';
import { getCompanyById } from '@/lib/auth';
import DashboardShellClient from './dashboard-shell-client';

interface DashboardShellProps {
  user: User;
  role: Role;
  children: React.ReactNode;
}

export default async function DashboardShell({
  user,
  role,
  children,
}: DashboardShellProps) {
  const company = await getCompanyById(user.companyId);
  const theme = company?.settings?.theme;
  const useCustomTheme = company?.settings?.brandingCustomization && theme;
  const logoUrl = company?.settings?.logoUrl;
  const companyName = company?.name;

  const customThemeStyles = useCustomTheme
    ? `
    :root {
      ${theme.light?.primary ? `--primary: ${theme.light.primary};` : ''}
      ${theme.light?.accent ? `--accent: ${theme.light.accent};` : ''}
    }
    .dark {
      ${theme.dark?.primary ? `--primary: ${theme.dark.primary};` : ''}
      ${theme.dark?.accent ? `--accent: ${theme.dark.accent};` : ''}
    }
  `
    : '';

  return (
    <DashboardShellClient
      user={user}
      role={role}
      logoUrl={logoUrl}
      companyName={companyName}
      customThemeStyles={customThemeStyles}
    >
      {children}
    </DashboardShellClient>
  );
}
