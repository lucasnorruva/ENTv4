import { Role, UserRoles } from "@/lib/constants";
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

import AdminDashboard from "@/components/dashboards/admin-dashboard";
import SupplierDashboard from "@/components/dashboards/supplier-dashboard";
import AuditorDashboard from "@/components/dashboards/auditor-dashboard";
import ComplianceManagerDashboard from "@/components/dashboards/compliance-manager-dashboard";
import DeveloperDashboard from "@/components/dashboards/developer-dashboard";
import BusinessAnalystDashboard from "@/components/dashboards/business-analyst-dashboard";
import RecyclerDashboard from "@/components/dashboards/recycler-dashboard";
import ManufacturerDashboard from "@/components/dashboards/manufacturer-dashboard";
import ServiceProviderDashboard from "@/components/dashboards/service-provider-dashboard";
import OverviewDashboard from "@/components/dashboards/overview-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);
  const products = await getProducts();
  const flaggedProducts = products.filter(
    (p) => p.verificationStatus === "Failed",
  );
  const recyclingProducts = products.filter((p) => p.status !== "Archived");

  const renderDashboard = () => {
    switch (user.roles[0]) {
      case UserRoles.ADMIN:
        return <AdminDashboard />;
      case UserRoles.SUPPLIER:
        return <SupplierDashboard initialProducts={products} />;
      case UserRoles.AUDITOR:
        return <AuditorDashboard products={products} />;
      case UserRoles.COMPLIANCE_MANAGER:
        return <ComplianceManagerDashboard flaggedProducts={flaggedProducts} />;
      case UserRoles.DEVELOPER:
        return <DeveloperDashboard />;
      case UserRoles.BUSINESS_ANALYST:
        return <BusinessAnalystDashboard products={products} />;
      case UserRoles.RECYCLER:
        return <RecyclerDashboard products={recyclingProducts} />;
      case UserRoles.MANUFACTURER:
        return <ManufacturerDashboard products={products} />;
      case UserRoles.SERVICE_PROVIDER:
        return <ServiceProviderDashboard />;
      default:
        return <OverviewDashboard />;
    }
  };

  return <>{renderDashboard()}</>;
}
