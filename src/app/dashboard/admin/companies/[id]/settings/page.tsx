// src/app/dashboard/admin/companies/[id]/settings/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

import { getCurrentUser, getCompanyById } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import CompanySettingsForm from '@/components/company-settings-form';

export const dynamic = 'force-dynamic';

export default async function CompanySettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const company = await getCompanyById(params.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/admin/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            {company.name} Settings
          </h1>
          <p className="text-muted-foreground">
            Manage tenant-specific feature flags and configurations.
          </p>
        </div>
      </div>
      <CompanySettingsForm adminUser={user} company={company} />
    </div>
  );
}
