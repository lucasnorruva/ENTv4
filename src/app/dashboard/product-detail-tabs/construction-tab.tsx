
'use client';

import React from 'react';
import { Hammer, Weight, ShieldAlert, BadgeInfo } from 'lucide-react';
import type { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

interface ConstructionTabProps {
  product: Product;
}

export default function ConstructionTab({ product }: ConstructionTabProps) {
  const { constructionAnalysis } = product;

  if (!constructionAnalysis) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No construction material analysis available for this product.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Hammer />
            Construction Material Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis of the product's key construction properties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoRow
          icon={Weight}
          label="Embodied Carbon"
          value={`${constructionAnalysis.embodiedCarbon.value} ${constructionAnalysis.embodiedCarbon.unit}`}
        >
          <p className="text-xs text-muted-foreground mt-1">
            {constructionAnalysis.embodiedCarbon.assessment}
          </p>
        </InfoRow>

        <InfoRow icon={ShieldAlert} label="Recyclability Potential">
          <Badge
            variant={
              constructionAnalysis.recyclabilityPotential === 'High'
                ? 'default'
                : constructionAnalysis.recyclabilityPotential === 'Medium'
                ? 'secondary'
                : 'destructive'
            }
          >
            {constructionAnalysis.recyclabilityPotential}
          </Badge>
        </InfoRow>

        <InfoRow icon={BadgeInfo} label="Compliance Notes">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
            {constructionAnalysis.complianceNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </InfoRow>
      </CardContent>
    </Card>
  );
}
