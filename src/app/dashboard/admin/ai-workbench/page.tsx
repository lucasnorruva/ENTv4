
'use client';

import { useState, useEffect } from 'react';
import SupplierScorer from '@/components/ai-workbench/supplier-scorer';
import RouteRiskAnalyzer from '@/components/ai-workbench/route-risk-analyzer';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { type User } from '@/types';
import RoiCalculator from '@/components/ai-workbench/roi-calculator';
import HsCodeClassifier from '@/components/ai-workbench/hs-code-classifier';
import LifecyclePredictor from '@/components/ai-workbench/lifecycle-predictor';
import TestGeneratorClient from '@/components/test-generator-client';

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
        <div className="space-y-8">
          <h2 className="text-xl font-semibold border-b pb-2">Business &amp; Risk Analysis</h2>
          <HsCodeClassifier user={user} />
          <LifecyclePredictor user={user} />
          <RoiCalculator user={user} />
          <RouteRiskAnalyzer user={user} />
          <SupplierScorer user={user} />
        </div>
        <div className="space-y-8">
          <h2 className="text-xl font-semibold border-b pb-2">Developer Tools</h2>
          <TestGeneratorClient user={user} />
        </div>
      </div>
    </div>
  );
}
