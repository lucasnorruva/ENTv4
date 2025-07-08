// src/app/dashboard/service-provider/analytics/page.tsx
import ServiceProviderAnalyticsClient from "@/components/dashboards/service-provider-analytics-client";
import { getCurrentUser } from "@/lib/auth";
import { UserRoles } from "@/lib/constants";

export default async function AnalyticsPage() {
    const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);
    return <ServiceProviderAnalyticsClient user={user} />
}
