// src/app/dashboard/developer/page.tsx
import DeveloperDashboardClient from '@/components/developer-dashboard-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // The client component now contains all the dashboard widgets and layout logic.
  return <DeveloperDashboardClient />;
}
