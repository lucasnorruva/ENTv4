// src/app/dashboard/compliance/page.tsx
import { getCompliancePaths } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import CompliancePathManagement from '@/components/compliance-path-management';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const [initialPaths, user] = await Promise.all([
    getCompliancePaths(),
    getCurrentUser('Admin'),
  ]);

  return (
    <CompliancePathManagement initialCompliancePaths={initialPaths} user={user} />
  );
}
