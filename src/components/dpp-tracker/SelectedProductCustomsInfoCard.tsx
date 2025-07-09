// src/components/dpp-tracker/SelectedProductCustomsInfoCard.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  X,
  Package,
  Truck,
  CalendarDays,
  ExternalLink,
  Globe,
  Loader2,
  Bot,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { Product, CustomsAlert, User } from '@/types';
import { cn } from '@/lib/utils';
import {
  getStatusIcon,
  getStatusBadgeVariant,
  getStatusBadgeClasses,
} from '@/lib/dpp-display-utils';
import { ScrollArea } from '../ui/scroll-area';

interface SelectedProductCustomsInfoCardProps {
  product: Product;
  user: User;
  alerts: CustomsAlert[];
  onDismiss: () => void;
  destinationCountry?: string | null;
  roleSlug: string;
}

const RiskLevelBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' | 'Very High' }) => {
  const Icon = level === 'Low' ? ShieldCheck : ShieldAlert;

  const colorClass = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    'Very High': 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
  };

  return (
    <Badge variant={'outline'} className={cn('capitalize text-xs', colorClass[level])}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {level} Risk
    </Badge>
  );
};


export default function SelectedProductCustomsInfoCard({
  product: initialProduct,
  user,
  alerts,
  onDismiss,
  destinationCountry,
  roleSlug,
}: SelectedProductCustomsInfoCardProps) {
  const [product, setProduct] = useState(initialProduct);
  const { toast } = useToast();
  const [isAnalyzing, startAnalysisTransition] = useTransition();

  const { transit } = product;

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const handleAnalyzeRoute = () => {
    startAnalysisTransition(async () => {
      try {
        const updatedProduct = await analyzeProductTransitRoute(product.id, user.id);
        setProduct(updatedProduct);
        toast({
          title: 'Analysis Complete',
          description: 'The transit route risk has been assessed.',
        });
      } catch (error: any) {
        toast({
          title: 'Analysis Failed',
          description: error.message || 'Could not analyze the route.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!transit) {
    return (
      <Card className="absolute bottom-4 right-4 z-20 w-full max-w-md shadow-xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-md font-semibold">
              {product.productName}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-xs space-y-2">
          <p className="text-sm text-muted-foreground">
            No active transit information available for this product.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TransportIcon =
    transit.transport === 'Ship'
      ? Ship
      : transit.transport === 'Truck'
      ? Truck
      : Plane;

  const etaDate = new Date(transit.eta);

  const DppStatusIcon = getStatusIcon(product.verificationStatus);
  const dppStatusBadgeVariant = getStatusBadgeVariant(
    product.verificationStatus,
  );
  const dppStatusClasses = getStatusBadgeClasses(product.verificationStatus);
  const formattedDppStatus = (product.verificationStatus || 'Not Submitted')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  return (
    <Card className="absolute bottom-4 right-4 z-20 w-full max-w-md shadow-xl bg-card/95 backdrop-blur-sm flex flex-col max-h-[calc(100vh-8rem)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
        <div className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-md font-semibold">
            {product.productName}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="px-4 pb-4 text-xs space-y-2">
          <p className="text-sm text-muted-foreground">
            ID:{' '}
            <span className="font-mono text-foreground">{product.id}</span>
          </p>

          <div className="p-2 border rounded-md bg-muted/30 space-y-1.5">
            <h4 className="font-medium text-foreground">Transit Details:</h4>
            <p>
              <strong className="text-muted-foreground">Stage:</strong>{' '}
              {transit.stage}
            </p>
            <p className="flex items-center">
              <strong className="text-muted-foreground mr-1">Transport:</strong>{' '}
              <TransportIcon className="h-4 w-4 mr-1 text-primary" />{' '}
              {transit.transport}
            </p>
            <p>
              <strong className="text-muted-foreground">Origin:</strong>{' '}
              {transit.origin}
            </p>
            <p>
              <strong className="text-muted-foreground">Destination:</strong>{' '}
              {transit.destination}
            </p>
            <div className="flex items-center">
              <strong className="text-muted-foreground mr-1">ETA:</strong>
              {format(etaDate, 'PPP')}
            </div>
            <p className="flex items-center">
              <strong className="text-muted-foreground mr-1">
                DPP Status:
              </strong>
              <Badge
                className={cn('text-xs capitalize', dppStatusClasses)}
                variant={dppStatusBadgeVariant}
              >
                {React.cloneElement(DppStatusIcon, {
                  className: 'mr-1 h-3 w-3',
                })}
                {formattedDppStatus}
              </Badge>
            </p>
          </div>

          {alerts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <h4 className="font-medium text-destructive mb-1">
                Active Alerts ({alerts.length}):
              </h4>
              <ul className="space-y-1">
                {alerts.map(alert => (
                  <li
                    key={alert.id}
                    className="p-1.5 bg-destructive/10 rounded-sm border border-destructive/30"
                  >
                    <p className="font-semibold text-destructive text-[0.7rem] leading-tight">
                      {alert.message}
                    </p>
                    <p className="text-muted-foreground text-[0.65rem]" suppressHydrationWarning>
                      Severity: {alert.severity} - {alert.timestamp}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {product.transitRiskAnalysis && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <h4 className="font-medium text-foreground mb-1">Risk Analysis:</h4>
              <div className="p-2 border rounded-md bg-muted/30 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Overall Risk</span>
                  <RiskLevelBadge level={product.transitRiskAnalysis.riskLevel} />
                </div>
                <p className="text-xs text-muted-foreground italic">{product.transitRiskAnalysis.summary}</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside pt-1">
                  {product.transitRiskAnalysis.keyConsiderations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-primary text-xs"
              asChild
            >
              <Link
                href={`/products/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full DPP <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            {destinationCountry && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-primary text-xs"
                asChild
              >
                <Link
                  href={`/dashboard/${roleSlug}/customs?q=${destinationCountry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Customs Rules <Globe className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </ScrollArea>
      <CardFooter className="p-2 border-t">
        <Button className="w-full" onClick={handleAnalyzeRoute} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
          {product.transitRiskAnalysis ? 'Re-analyze Route' : 'Analyze Route Risk'}
        </Button>
      </CardFooter>
    </Card>
  );
}
