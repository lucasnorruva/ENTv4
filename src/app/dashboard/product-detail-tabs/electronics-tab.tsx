
'use client';

import React from 'react';
import { Cpu, ShieldCheck, ShieldAlert, BadgeInfo } from 'lucide-react';
import type { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <div className="text-muted-foreground text-sm">{value}</div>}
        {children}
      </div>
    </div>
  );
}

interface ElectronicsTabProps {
  product: Product;
}

export default function ElectronicsTab({ product }: ElectronicsTabProps) {
  const { electronicsAnalysis } = product;

  if (!electronicsAnalysis) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No electronics compliance analysis available.
      </div>
    );
  }

  const ComplianceBadge = ({ compliant }: { compliant: boolean }) => (
    <Badge variant={compliant ? 'default' : 'destructive'}>
      {compliant ? <ShieldCheck className="mr-1 h-3 w-3" /> : <ShieldAlert className="mr-1 h-3 w-3" />}
      {compliant ? 'Compliant' : 'Non-Compliant'}
    </Badge>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Cpu /> Electronics Compliance Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis of the product's compliance with key electronics regulations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoRow icon={ShieldCheck} label="RoHS Compliance">
          <div className="space-y-1">
            <ComplianceBadge compliant={electronicsAnalysis.rohs.compliant} />
            <p className="text-xs text-muted-foreground">{electronicsAnalysis.rohs.reason}</p>
          </div>
        </InfoRow>

        <InfoRow icon={ShieldCheck} label="WEEE Compliance">
           <div className="space-y-1">
            <ComplianceBadge compliant={electronicsAnalysis.weee.compliant} />
            <p className="text-xs text-muted-foreground">{electronicsAnalysis.weee.reason}</p>
          </div>
        </InfoRow>

        <InfoRow icon={ShieldCheck} label="CE Marking">
           <div className="space-y-1">
            <ComplianceBadge compliant={electronicsAnalysis.ceMarking.compliant} />
            <p className="text-xs text-muted-foreground">{electronicsAnalysis.ceMarking.reason}</p>
          </div>
        </InfoRow>
        
        <InfoRow icon={BadgeInfo} label="Overall Summary">
            <p className="text-sm text-muted-foreground">{electronicsAnalysis.summary}</p>
        </InfoRow>
      </CardContent>
    </Card>
  );
}
