
// src/components/dpp-tracker/SimulatedRouteInfoCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { SimulatedRoute } from '@/types';
import { cn } from '@/lib/utils';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface SimulatedRouteInfoCardProps {
  route: SimulatedRoute & { productName: string };
  onDismiss: () => void;
}

const RiskLevelBadge = ({ level }: { level: SimulatedRoute['riskLevel'] }) => {
  const Icon =
    level === 'Low'
      ? ShieldCheck
      : level === 'Medium'
      ? ShieldAlert
      : AlertTriangle;

  const colorClass = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    Medium:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    'Very High':
      'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
  };

  return (
    <Badge variant={'outline'} className={cn('capitalize text-xs', colorClass[level])}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {level} Risk
    </Badge>
  );
};

export default function SimulatedRouteInfoCard({
  route,
  onDismiss,
}: SimulatedRouteInfoCardProps) {
  return (
    <Card className="absolute top-24 left-4 z-20 w-full max-w-sm shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4 px-4">
        <div className="space-y-1">
          <CardTitle className="text-md font-semibold">
            Simulated Route Analysis
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs">
            <Package className="h-3 w-3"/>
            {route.productName}
          </CardDescription>
          <div className="flex items-center gap-2 pt-1">
            <p className="text-sm font-medium">{route.origin} → {route.destination}</p>
            <RiskLevelBadge level={route.riskLevel} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-xs space-y-2">
        <div>
          <h4 className="font-semibold text-sm mb-1">Risk Summary</h4>
          <p className="text-sm text-muted-foreground">{route.summary}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Key Considerations</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {route.keyConsiderations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
