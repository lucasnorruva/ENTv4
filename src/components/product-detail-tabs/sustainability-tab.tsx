// src/components/product-detail-tabs/sustainability-tab.tsx
'use client';

import { Leaf, Quote } from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import RoiCalculatorWidget from '../roi-calculator-widget';

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

interface SustainabilityTabProps {
  product: Product;
}

export default function SustainabilityTab({ product }: SustainabilityTabProps) {
    const esg = product.sustainability;
    
    return (
      <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Sustainability & ESG Metrics</CardTitle>
            <CardDescription>
                AI-generated scores based on product data.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {esg ? (
                <div className="space-y-4">
                <InfoRow icon={Leaf} label="Overall ESG Score">
                    <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary">
                        {esg.score} / 100
                    </span>
                    <Progress value={esg.score} className="w-full" />
                    </div>
                </InfoRow>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                    <p className="text-xs text-muted-foreground">
                        Environmental
                    </p>
                    <p className="text-lg font-bold">
                        {esg.environmental}
                    </p>
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">
                        Social
                    </p>
                    <p className="text-lg font-bold">{esg.social}</p>
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">
                        Governance
                    </p>
                    <p className="text-lg font-bold">
                        {esg.governance}
                    </p>
                    </div>
                </div>
                <InfoRow
                    icon={Quote}
                    label="AI Summary"
                    value={esg.summary}
                />
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">
                Sustainability data has not been generated yet.
                </p>
            )}
            </CardContent>
        </Card>
        <RoiCalculatorWidget product={product} />
      </div>
    )
}
