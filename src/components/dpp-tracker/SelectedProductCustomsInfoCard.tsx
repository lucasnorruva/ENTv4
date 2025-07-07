// src/components/dpp-tracker/SelectedProductCustomsInfoCard.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
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
  Ship,
  Plane,
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  Globe,
  Loader2,
  Bot,
  Zap,
} from 'lucide-react';
import type { Product, CustomsAlert, User, ProductTransitRiskAnalysis } from '@/types';
import { cn } from '@/lib/utils';
import {
  getStatusIcon,
  getStatusBadgeVariant,
  getStatusBadgeClasses,
} from '@/lib/dppDisplayUtils';
import { ScrollArea } from '../ui/scroll-area';
import { analyzeProductTransitRisk } from '@/lib/actions/product-ai-actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

interface SelectedProductCustomsInfoCardProps {
  product: Product;
  user: User;
  alerts: CustomsAlert[];
  onDismiss: () => void;
  destinationCountry?: string | null;
  roleSlug: string;
}

const RiskLevelBadgeDialog = ({ level }: { level: ProductTransitRiskAnalysis['riskLevel'] }) => {
    const Icon = level === 'Low' ? ShieldCheck : AlertTriangle;
    const colorClass = {
      Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
      Medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
      High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
      'Very High': 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
    };
  
    return (
      <Badge variant={'outline'} className={cn('capitalize text-sm', colorClass[level])}>
        <Icon className="mr-1 h-3.5 w-3.5" />
        {level} Risk
      </Badge>
    );
  };

export default function SelectedProductCustomsInfoCard({
  product,
  user,
  alerts,
  onDismiss,
  destinationCountry,
  roleSlug,
}: SelectedProductCustomsInfoCardProps) {
  const { transit } = product;
  const [isMounted, setIsMounted] = useState(false);
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<ProductTransitRiskAnalysis | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAnalyzeRoute = () => {
    if (!product.transit) {
      toast({ title: 'No transit data available.', variant: 'destructive' });
      return;
    }
    startAnalysisTransition(async () => {
        try {
            const result = await analyzeProductTransitRisk(product.id, user.id);
            setAnalysisResult(result);
            setIsAnalysisDialogOpen(true);
        } catch (error: any) {
            toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
        }
    });
  }

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

  const renderEta = () => {
    const formattedDate = format(etaDate, 'PPP');

    if (!isMounted) {
      // Render a static, consistently formatted date on the server to prevent mismatch
      return formattedDate;
    }

    // Client-side only rendering for time-sensitive badges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isEtaPast = etaDate < today;
    const isEtaToday = etaDate.toDateString() === today.toDateString();

    if (isEtaPast) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Overdue: {formattedDate}
        </Badge>
      );
    }
    if (isEtaToday) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700"
        >
          <CalendarDays className="mr-1 h-3 w-3" />
          Due Today: {formattedDate}
        </Badge>
      );
    }
    return formattedDate;
  };

  const DppStatusIcon = getStatusIcon(product.verificationStatus);
  const dppStatusBadgeVariant = getStatusBadgeVariant(
    product.verificationStatus,
  );
  const dppStatusClasses = getStatusBadgeClasses(product.verificationStatus);
  const formattedDppStatus = (product.verificationStatus || 'Not Submitted')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  return (
    <>
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
              <div className="flex items-center" suppressHydrationWarning>
                <strong className="text-muted-foreground mr-1">ETA:</strong>
                {renderEta()}
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
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Analyze Route Risk
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>AI Route Risk Analysis</DialogTitle>
                <DialogDescription>
                    {product.transit.origin} → {product.transit.destination}
                </DialogDescription>
            </DialogHeader>
            {analysisResult ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Overall Risk Level:</span>
                        <RiskLevelBadgeDialog level={analysisResult.riskLevel} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Summary</h4>
                        <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Key Considerations</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {analysisResult.keyConsiderations.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}
            <DialogFooter>
                <Button onClick={() => setIsAnalysisDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
