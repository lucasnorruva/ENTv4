
// src/app/dashboard/admin/ai-workbench/page.tsx
import RegulationPredictor from '@/components/ai-workbench/regulation-predictor';
import SupplierScorer from '@/components/ai-workbench/supplier-scorer';
import RouteRiskAnalyzer from '@/components/ai-workbench/route-risk-analyzer';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AiWorkbenchPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Workbench</h1>
        <p className="text-muted-foreground">
          Run advanced AI analysis, generate predictions, and gain strategic insights on demand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RegulationPredictor user={user} />
        <SupplierScorer user={user} />
      </div>
       <RouteRiskAnalyzer user={user} />
    </div>
  );
}
