// src/components/product-detail-tabs/lifecycle-tab.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  HeartPulse,
  Wrench,
  Recycle,
  BookText,
  Paperclip,
  View,
  Fingerprint,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import type { Product, ServiceRecord } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

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
  const prediction = product.sustainability?.lifecyclePrediction;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle & Repair</CardTitle>
          <CardDescription>
            Data related to the product's lifespan, repairability, and service
            history.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  </a>
                </Button>
                {product.manualFileHash && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-2 flex cursor-help items-center gap-2 text-xs text-muted-foreground">
                          <Fingerprint className="h-3 w-3" />
                          <span className="font-mono">
                            SHA256: {product.manualFileHash.substring(0, 16)}
                            ...
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">
                          {product.manualFileHash}
                        </p>
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
                        <div className="mt-2 flex cursor-help items-center gap-2 text-xs text-muted-foreground">
                          <Fingerprint className="h-3 w-3" />
                          <span className="font-mono">
                            SHA256: {product.model3dFileHash.substring(0, 16)}
                            ...
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">
                          {product.model3dFileHash}
                        </p>
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
            icon={Recycle}
            label="Recycling Instructions"
            value={product.lifecycle?.recyclingInstructions || 'Not provided.'}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit /> AI Lifecycle Prediction
          </CardTitle>
          <CardDescription>
            AI-powered forecasts about this product's expected lifespan and key failure points.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {prediction ? (
              <div className='space-y-2'>
                <InfoRow icon={HeartPulse} label="Predicted Lifespan" value={`${prediction.predictedLifespanYears} years`} />
                <InfoRow icon={Wrench} label="Optimal Replacement" value={`${prediction.optimalReplacementTimeYears} years`} />
                <InfoRow icon={AlertTriangle} label="Key Failure Points">
                   <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {prediction.keyFailurePoints.map((point, i) => <li key={i}>{point}</li>)}
                   </ul>
                </InfoRow>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No prediction data available. Generate it from the "AI Actions" menu.
              </p>
            )}
        </CardContent>
      </Card>

      {product.serviceHistory && product.serviceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {product.serviceHistory
                .sort(
                  (a: ServiceRecord, b: ServiceRecord) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((record: ServiceRecord) => (
                  <div key={record.id} className="border-l-2 pl-3 text-sm">
                    <p className="font-semibold text-foreground">
                      {record.notes}
                    </p>
                    <p
                      className="mt-1 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      Serviced by {record.providerName} on{' '}
                      {format(new Date(record.createdAt), 'PPP')}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
