import { Role, UserRoles } from "@/lib/constants";
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

import AdminDashboard from "@/components/dashboards/admin-dashboard";
import SupplierDashboard from "@/components/dashboards/supplier-dashboard";
import AuditorDashboard from "@/components/dashboards/auditor-dashboard";
import ComplianceManagerDashboard from "@/components/dashboards/compliance-manager-dashboard";

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

  const renderDashboard = () => {
    switch (user.roles[0]) {
      case UserRoles.ADMIN:
        return <AdminDashboard user={user} />;
      case UserRoles.SUPPLIER:
        return <SupplierDashboard initialProducts={products} user={user} />;
      case UserRoles.AUDITOR:
        return <AuditorDashboard products={products} user={user} />;
      case UserRoles.COMPLIANCE_MANAGER:
        return (
          <ComplianceManagerDashboard
            flaggedProducts={flaggedProducts}
            user={user}
          />
        );
      // Other role dashboards will be added later
      default:
        return <SupplierDashboard initialProducts={products} user={user} />;
    }
  };

  return <>{renderDashboard()}</>;
}
