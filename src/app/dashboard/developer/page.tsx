// src/app/dashboard/developer/page.tsx
import DeveloperDashboardClient from '@/components/developer-dashboard-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // No data fetching needed here, the client component is self-contained for the dashboard view.
  return <DeveloperDashboardClient />;
}
