import { Role, UserRoles } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

import AdminDashboard from "@/components/dashboards/admin-dashboard";
import SupplierDashboard from "@/components/dashboards/supplier-dashboard";
import AuditorDashboard from "@/components/dashboards/auditor-dashboard";
import ComplianceManagerDashboard from "@/components/dashboards/compliance-manager-dashboard";
import BusinessAnalystDashboard from "@/components/dashboards/business-analyst-dashboard";
import ManufacturerDashboard from "@/components/dashboards/manufacturer-dashboard";
import ServiceProviderDashboard from "@/components/dashboards/service-provider-dashboard";
import RecyclerDashboard from "@/components/dashboards/recycler-dashboard";
import DeveloperDashboard from "@/components/dashboards/developer-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  const renderDashboard = () => {
    switch (user.roles[0]) {
      case UserRoles.ADMIN:
        return <AdminDashboard user={user} />;
      case UserRoles.SUPPLIER:
        return <SupplierDashboard user={user} />;
      case UserRoles.AUDITOR:
        return <AuditorDashboard user={user} />;
      case UserRoles.COMPLIANCE_MANAGER:
        return <ComplianceManagerDashboard user={user} />;
      case UserRoles.BUSINESS_ANALYST:
        return <BusinessAnalystDashboard user={user} />;
      case UserRoles.MANUFACTURER:
        return <ManufacturerDashboard user={user} />;
      case UserRoles.SERVICE_PROVIDER:
        return <ServiceProviderDashboard user={user} />;
      case UserRoles.RECYCLER:
        return <RecyclerDashboard user={user} />;
      case UserRoles.DEVELOPER:
        return <DeveloperDashboard user={user} />;
      default:
        return <SupplierDashboard user={user} />;
    }
  };

  return <>{renderDashboard()}</>;
}
