// src/app/dashboard/manufacturer/analytics/page.tsx
import ManufacturerAnalyticsClient from "@/components/dashboards/manufacturer-analytics-client";
import { getCurrentUser } from "@/lib/auth";
import { UserRoles } from "@/lib/constants";

export default async function AnalyticsPage() {
    const user = await getCurrentUser(UserRoles.MANUFACTURER);
    return <ManufacturerAnalyticsClient user={user} />
}
