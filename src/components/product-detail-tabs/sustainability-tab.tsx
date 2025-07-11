// src/components/product-detail-tabs/sustainability-tab.tsx
'use client';

import { Leaf, Quote, Thermometer, Footprints, Layers } from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
  const aiLifecycle = product.sustainability?.lifecycleAnalysis;
  const scopeEmissions = product.lifecycle?.scopeEmissions;
  const traceabilityScore = product.sustainability?.traceabilityScore;

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
                  <p className="text-xs text-muted-foreground">Environmental</p>
                  <p className="text-lg font-bold">{esg.environmental}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Social</p>
                  <p className="text-lg font-bold">{esg.social}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Governance</p>
                  <p className="text-lg font-bold">{esg.governance}</p>
                </div>
              </div>
              <InfoRow icon={Quote} label="AI ESG Summary" value={esg.summary} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Sustainability data has not been generated yet.
            </p>
          )}
        </CardContent>
      </Card>
      
       {traceabilityScore !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Traceability</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={Layers} label="Traceability Score">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary">
                  {traceabilityScore}%
                </span>
                <Progress value={traceabilityScore} className="w-full" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Percentage of materials traced to origin.</p>
            </InfoRow>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow
            icon={Thermometer}
            label="Carbon Footprint"
            value={
              product.lifecycle?.carbonFootprint
                ? `${product.lifecycle.carbonFootprint} kg CO2-eq`
                : 'Not available'
            }
          >
            {product.lifecycle?.carbonFootprintMethod && (
              <p className="text-xs text-muted-foreground">
                Method: {product.lifecycle.carbonFootprintMethod}
              </p>
            )}
          </InfoRow>
           {scopeEmissions && (
                <InfoRow icon={Footprints} label="Scope Emissions (kg CO2-eq)">
                  <div className="grid grid-cols-3 gap-4 text-center mt-2 border rounded-md p-2 bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Scope 1</p>
                      <p className="font-bold">{scopeEmissions.scope1 ?? 'N/A'}</p>
                    </div>
                     <div>
                      <p className="text-xs text-muted-foreground">Scope 2</p>
                      <p className="font-bold">{scopeEmissions.scope2 ?? 'N/A'}</p>
                    </div>
                     <div>
                      <p className="text-xs text-muted-foreground">Scope 3</p>
                      <p className="font-bold">{scopeEmissions.scope3 ?? 'N/A'}</p>
                    </div>
                  </div>
                </InfoRow>
            )}
          {aiLifecycle && (
            <InfoRow icon={Quote} label="AI Impact Analysis">
              <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                <p>
                  <strong>Manufacturing:</strong>{' '}
                  {aiLifecycle.lifecycleStages.manufacturing}
                </p>
                <p>
                  <strong>Use Phase:</strong>{' '}
                  {aiLifecycle.lifecycleStages.usePhase}
                </p>
                <p>
                  <strong>End-of-Life:</strong>{' '}
                  {aiLifecycle.lifecycleStages.endOfLife}
                </p>
              </div>
            </InfoRow>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

