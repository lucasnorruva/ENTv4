
// src/components/product-detail-tabs/food-safety-tab.tsx
'use client';

import React from 'react';
import { Utensils, AlertTriangle, ShieldCheck } from 'lucide-react';
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

interface FoodSafetyTabProps {
  product: Product;
}

export default function FoodSafetyTab({ product }: FoodSafetyTabProps) {
  const { foodSafetyAnalysis } = product;

  if (!foodSafetyAnalysis) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No food safety analysis available for this product.
      </div>
    );
  }

  const riskLevelVariant = {
    Low: 'default',
    Medium: 'secondary',
    High: 'destructive',
  }[foodSafetyAnalysis.riskLevel] as 'default' | 'secondary' | 'destructive';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Utensils />
            Food Safety Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis of the product's ingredients and packaging for food safety risks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoRow icon={AlertTriangle} label="Overall Risk Level">
            <Badge variant={riskLevelVariant}>{foodSafetyAnalysis.riskLevel}</Badge>
        </InfoRow>

        <InfoRow icon={AlertTriangle} label="Potential Allergens">
            {foodSafetyAnalysis.potentialAllergens.length > 0 ? (
                 <div className="flex flex-wrap gap-2 mt-1">
                    {foodSafetyAnalysis.potentialAllergens.map((allergen, i) => (
                        <Badge key={i} variant="destructive">{allergen}</Badge>
                    ))}
                 </div>
            ) : (
                <p className="text-sm text-muted-foreground">No common allergens detected.</p>
            )}
        </InfoRow>

        <InfoRow icon={ShieldCheck} label="Compliance Notes">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
            {foodSafetyAnalysis.complianceNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </InfoRow>
      </CardContent>
    </Card>
  );
}
