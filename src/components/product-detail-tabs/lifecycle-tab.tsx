// src/components/product-detail-tabs/lifecycle-tab.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Thermometer,
  Lightbulb,
  Sparkles,
  HeartPulse,
  BatteryCharging,
  Wrench,
  Recycle,
  BookText,
  Paperclip,
  View,
  Fingerprint,
} from 'lucide-react';
import type { Product, ServiceRecord } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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

interface LifecycleTabProps {
  product: Product;
}

export default function LifecycleTab({ product }: LifecycleTabProps) {
  const aiLifecycle = product.sustainability?.lifecycleAnalysis;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle & Circularity</CardTitle>
        <CardDescription>
          Data related to the product's lifespan, repairability, and
          end-of-life.
        </CardDescription>
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
        <InfoRow
          icon={HeartPulse}
          label="Expected Lifespan"
          value={
            product.lifecycle?.expectedLifespan
              ? `${product.lifecycle.expectedLifespan} years`
              : 'Not available'
          }
        />
        <InfoRow
          icon={Wrench}
          label="Repairability Score"
          value={
            product.lifecycle?.repairabilityScore
              ? `${product.lifecycle.repairabilityScore} / 10`
              : 'Not available'
          }
        />
        <InfoRow icon={BookText} label="Service Manual">
          {product.manualUrl ? (
            <div>
              <Button asChild variant="outline" size="sm">
                <a
                  href={product.manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  {product.manualFileName || 'Download Manual'}
                  {product.manualFileSize && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(product.manualFileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </a>
              </Button>
               {product.manualFileHash && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2 cursor-help">
                                <Fingerprint className="h-3 w-3" />
                                <span className="font-mono">SHA256: {product.manualFileHash.substring(0, 16)}...</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-mono text-xs">{product.manualFileHash}</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not provided.</p>
          )}
        </InfoRow>
         <InfoRow icon={View} label="3D Model">
          {product.model3dUrl ? (
             <div>
              <Button asChild variant="outline" size="sm">
                <a
                  href={product.model3dUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  {product.model3dFileName || 'Download Model'}
                </a>
              </Button>
               {product.model3dFileHash && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2 cursor-help">
                                <Fingerprint className="h-3 w-3" />
                                <span className="font-mono">SHA256: {product.model3dFileHash.substring(0, 16)}...</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-mono text-xs">{product.model3dFileHash}</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not provided.</p>
          )}
        </InfoRow>
        <InfoRow
          icon={Lightbulb}
          label="Energy Efficiency Class"
          value={
            product.lifecycle?.energyEfficiencyClass ? (
              <Badge variant="outline">
                {product.lifecycle.energyEfficiencyClass}
              </Badge>
            ) : (
              'Not available'
            )
          }
        />
        {product.battery && (
          <InfoRow
            icon={BatteryCharging}
            label="Battery"
            value={`${product.battery.type || 'N/A'}${
              product.battery.capacityMah
                ? `, ${product.battery.capacityMah}mAh`
                : ''
            }`}
          >
            <p className="text-xs text-muted-foreground">
              Removable: {product.battery.isRemovable ? 'Yes' : 'No'}
            </p>
          </InfoRow>
        )}
        <InfoRow
          icon={Recycle}
          label="Recycling Instructions"
          value={
            product.lifecycle?.recyclingInstructions || 'Not provided.'
          }
        />

        {product.serviceHistory && product.serviceHistory.length > 0 && (
          <InfoRow icon={Wrench} label="Service History">
            <div className="space-y-4 mt-2">
              {product.serviceHistory
                .sort(
                  (a: ServiceRecord, b: ServiceRecord) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((record: ServiceRecord) => (
                  <div key={record.id} className="text-sm border-l-2 pl-3">
                    <p className="font-semibold text-foreground">
                      {record.notes}
                    </p>
                    <p
                      className="text-xs text-muted-foreground mt-1"
                      suppressHydrationWarning
                    >
                      Serviced by {record.providerName} on{' '}
                      {format(new Date(record.createdAt), 'PPP')}
                    </p>
                  </div>
                ))}
            </div>
          </InfoRow>
        )}

        {aiLifecycle && (
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="ai-analysis">
              <AccordionTrigger>AI Lifecycle Analysis</AccordionTrigger>
              <AccordionContent>
                <InfoRow icon={Lightbulb} label="AI Stage Analysis">
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
                <InfoRow
                  icon={Sparkles}
                  label="AI Improvement Opportunities"
                >
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                    {aiLifecycle.improvementOpportunities.map((opp, i) => (
                      <li key={i}>{opp}</li>
                    ))}
                  </ul>
                </InfoRow>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
