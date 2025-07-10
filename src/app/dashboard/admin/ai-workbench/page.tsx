
'use client';

import { useState, useEffect } from 'react';
import RegulationPredictor from '@/components/ai-workbench/regulation-predictor';
import SupplierScorer from '@/components/ai-workbench/supplier-scorer';
import RouteRiskAnalyzer from '@/components/ai-workbench/route-risk-analyzer';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { type User } from '@/types';

export default function AiWorkbenchPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser(UserRoles.ADMIN).then(setUser);
  }, []);

  if (!user) {
    return null;
  }

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
