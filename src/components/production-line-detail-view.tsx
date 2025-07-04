// src/components/production-line-detail-view.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Factory, Wrench, Clock, Activity } from 'lucide-react';

import type { ProductionLine, ServiceTicket, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ProductionLineDetailViewProps {
  line: ProductionLine;
  serviceHistory: ServiceTicket[];
  user: User;
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

export default function ProductionLineDetailView({
  line,
  serviceHistory,
  user,
  roleSlug,
}: ProductionLineDetailViewProps) {
  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/${roleSlug}/lines`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Production Lines
        </Link>
      </Button>
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-muted p-3 rounded-full">
            <Factory className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{line.name}</h1>
            <p className="text-muted-foreground">{line.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Badge variant={getStatusVariant(line.status)} className="text-sm">
            {line.status}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{line.outputPerHour} units/hr</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span suppressHydrationWarning>
              Last Maintenance:{' '}
              {formatDistanceToNow(new Date(line.lastMaintenance), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench /> Maintenance History
          </CardTitle>
          <CardDescription>
            A log of all service tickets and maintenance performed on this line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceHistory.length > 0 ? (
            <div className="relative pl-6">
              <div className="absolute left-[35px] top-0 h-full w-px bg-border -translate-x-1/2" />
              {serviceHistory.map(ticket => (
                <div
                  key={ticket.id}
                  className="relative mb-8 flex items-start pl-8"
                >
                  <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground -translate-x-1/2">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{ticket.issue}</p>
                      <p
                        className="text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reported by: {ticket.customerName} on{' '}
                      {format(new Date(ticket.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              No maintenance history recorded for this line.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
