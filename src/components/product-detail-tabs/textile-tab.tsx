
// src/components/product-detail-tabs/textile-tab.tsx
'use client';

import React from 'react';
import { SwatchBook, Droplets, Microscope } from 'lucide-react';
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

interface TextileTabProps {
  product: Product;
}

export default function TextileTab({ product }: TextileTabProps) {
  const { textile, textileAnalysis } = product;

  if (!textile && !textileAnalysis) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No textile-specific data available for this product.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {textile && (
        <Card>
          <CardHeader>
            <CardTitle>Textile Information</CardTitle>
            <CardDescription>
              Detailed data about the product's fabric and construction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {textile?.fiberComposition && (
              <InfoRow icon={SwatchBook} label="Fiber Composition">
                <div className="space-y-1 mt-1">
                  {textile.fiberComposition.map((fiber, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{fiber.name}: {fiber.percentage}%</p>
                  ))}
                </div>
              </InfoRow>
            )}
            {textile?.dyeProcess && (
              <InfoRow icon={Droplets} label="Dyeing Process" value={textile.dyeProcess} />
            )}
             {textile?.weaveType && (
              <InfoRow icon={SwatchBook} label="Weave Type" value={textile.weaveType} />
            )}
          </CardContent>
        </Card>
      )}

      {textileAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Textile Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={Microscope} label="Identified Fibers">
               <div className="flex flex-wrap gap-2 mt-1">
                {textileAnalysis.identifiedFibers.map((fiber, i) => (
                    <Badge key={i} variant={fiber.type === 'Synthetic' ? 'destructive' : 'secondary'}>
                        {fiber.fiber}: {fiber.type}
                    </Badge>
                ))}
               </div>
            </InfoRow>
            <InfoRow icon={Microscope} label="Microplastic Shedding Risk">
                <Badge variant={textileAnalysis.microplasticSheddingRisk === 'High' ? 'destructive' : 'default'}>
                    {textileAnalysis.microplasticSheddingRisk}
                </Badge>
            </InfoRow>
            <InfoRow icon={Droplets} label="Dye Safety Assessment" value={textileAnalysis.dyeSafetyAssessment} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
