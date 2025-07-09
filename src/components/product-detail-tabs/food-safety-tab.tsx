
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
  const { foodSafetyAnalysis, foodSafety } = product;

  if (!foodSafetyAnalysis && !foodSafety) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No food safety information available for this product.
      </div>
    );
  }

  const riskLevelVariant = foodSafetyAnalysis
    ? {
        Low: 'default',
        Medium: 'secondary',
        High: 'destructive',
      }[foodSafetyAnalysis.riskLevel] as 'default' | 'secondary' | 'destructive'
    : 'outline';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Utensils />
            Food Safety Information
        </CardTitle>
        <CardDescription>
          Details on ingredients, allergens, and AI-powered safety analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {foodSafety?.ingredients && foodSafety.ingredients.length > 0 && (
          <InfoRow icon={Utensils} label="Ingredients">
            <p className="text-sm text-muted-foreground">{foodSafety.ingredients.map(i => i.value).join(', ')}</p>
          </InfoRow>
        )}
        {foodSafety?.allergens && (
          <InfoRow icon={AlertTriangle} label="Allergen Statement" value={foodSafety.allergens} />
        )}
        
        {foodSafetyAnalysis && (
            <>
                <InfoRow icon={AlertTriangle} label="AI Assessed Risk Level">
                    <Badge variant={riskLevelVariant}>{foodSafetyAnalysis.riskLevel}</Badge>
                </InfoRow>
                <InfoRow icon={AlertTriangle} label="AI Identified Potential Allergens">
                    {foodSafetyAnalysis.potentialAllergens.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {foodSafetyAnalysis.potentialAllergens.map((allergen, i) => (
                                <Badge key={i} variant="destructive">{allergen}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No common allergens detected by AI.</p>
                    )}
                </InfoRow>
                 <InfoRow icon={ShieldCheck} label="AI Compliance Notes">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                        {foodSafetyAnalysis.complianceNotes.map((note, i) => (
                        <li key={i}>{note}</li>
                        ))}
                    </ul>
                </InfoRow>
            </>
        )}
      </CardContent>
    </Card>
  );
}
