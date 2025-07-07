
// src/components/dpp-tracker/OperationalPointInfoCard.tsx
'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Factory, Activity, Box } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import type { ProductionLine } from '@/types';

interface OperationalPointInfoCardProps {
  line: ProductionLine;
  onDismiss: () => void;
  roleSlug: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Maintenance':
      return 'destructive';
    case 'Idle':
    default:
      return 'secondary';
  }
};

export default function OperationalPointInfoCard({
  line,
  onDismiss,
  roleSlug,
}: OperationalPointInfoCardProps) {
  return (
    <Card className="absolute top-24 left-4 z-20 w-full max-w-xs shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4 px-4">
        <div className="space-y-1">
          <CardTitle className="text-md font-semibold flex items-center gap-2">
            <Factory className="h-4 w-4" />
            {line.name}
          </CardTitle>
          <CardDescription>{line.location}</CardDescription>
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
      <CardContent className="px-4 pb-4 text-xs space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={getStatusVariant(line.status)}>{line.status}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Current Product</span>
          <span className="font-semibold truncate">{line.currentProduct}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Output</span>
          <span className="flex items-center gap-1 font-semibold">
            <Activity className="h-3 w-3" />
            {line.outputPerHour} units/hr
          </span>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full mt-2">
            <Link href={`/dashboard/${roleSlug}/lines/${line.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
