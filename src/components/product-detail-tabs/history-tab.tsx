// src/components/product-detail-tabs/history-tab.tsx
'use client';

import React, { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FilePlus,
  Wrench,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Archive,
  Recycle,
  List,
} from 'lucide-react';
import type { Product } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/dppDisplayUtils';


interface LifecycleEvent {
  date: Date;
  title: string;
  description: string;
  icon: React.ElementType;
}


const HistoryTab = ({ product }: { product: Product }) => {
  const events: LifecycleEvent[] = useMemo(() => {
    const allEvents: LifecycleEvent[] = [];

    // Creation Event
    allEvents.push({
      date: new Date(product.createdAt),
      title: 'Passport Created',
      description: `The initial digital product passport was created by ${product.supplier}.`,
      icon: FilePlus,
    });

    // Verification Events
    if (product.lastVerificationDate) {
      if (product.verificationStatus === 'Verified') {
        allEvents.push({
          date: new Date(product.lastVerificationDate),
          title: 'Passport Verified',
          description: 'The passport was successfully reviewed and verified.',
          icon: ShieldCheck,
        });
      } else if (product.verificationStatus === 'Failed') {
        allEvents.push({
          date: new Date(product.lastVerificationDate),
          title: 'Verification Failed',
          description: `Review resulted in failure. Reason: ${
            product.sustainability?.complianceSummary || 'Not specified'
          }`,
          icon: ShieldAlert,
        });
      }
    }

    // Service History
    product.serviceHistory?.forEach(record => {
      allEvents.push({
        date: new Date(record.createdAt),
        title: 'Product Serviced',
        description: `Serviced by ${record.providerName}. Notes: ${record.notes}`,
        icon: Wrench,
      });
    });

    // Customs History
    product.customs?.history?.forEach(event => {
      allEvents.push({
        date: new Date(event.date),
        title: 'Customs Inspection',
        description: `Status: ${event.status} at ${event.location} by ${event.authority}.`,
        icon: Globe,
      });
    });

    // Latest Customs Event
    if (product.customs && product.customs.date) {
        allEvents.push({
            date: new Date(product.customs.date),
            title: 'Customs Inspection',
            description: `Status: ${product.customs.status} at ${product.customs.location} by ${product.customs.authority}.`,
            icon: Globe,
        });
    }

    // End-of-Life Events
    if (product.endOfLifeStatus === 'Recycled') {
      allEvents.push({
        date: new Date(product.lastUpdated),
        title: 'Product Recycled',
        description: 'The product has been processed for recycling.',
        icon: Recycle,
      });
    } else if (product.endOfLifeStatus === 'Disposed') {
      allEvents.push({
        date: new Date(product.lastUpdated),
        title: 'Product Disposed',
        description: 'The product has been disposed of.',
        icon: Archive,
      });
    }

    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [product]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product History</CardTitle>
        <CardDescription>
          A chronological timeline of this product's entire lifecycle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[35px] top-0 h-full w-px bg-border -translate-x-1/2" />
            {events.map((event, index) => {
              const Icon = event.icon;
              return (
                <div
                  key={index}
                  className="relative mb-8 flex items-start pl-8"
                >
                  <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground -translate-x-1/2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{event.title}</p>
                      <p
                        className="text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDistanceToNow(event.date, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <List className="mx-auto h-12 w-12" />
            <p className="mt-4">No lifecycle events recorded for this product.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryTab;
