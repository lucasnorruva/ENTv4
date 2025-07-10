
// src/components/product-detail-tabs/overview-tab.tsx
'use client';

import Image from 'next/image';
import {
  Package,
  Fingerprint,
  Quote,
  Tag,
  Landmark,
  ListPlus,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { Product, CustomFieldDefinition } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import RelativeTime from '../relative-time';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 flex justify-between">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-right">{value}</p>
      </div>
    </div>
  );
}

function StatusCard({ product }: { product: Product }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <InfoRow icon={Calendar} label="Created" value={<RelativeTime date={product.createdAt} />} />
                <InfoRow icon={Calendar} label="Last Updated" value={<RelativeTime date={product.lastUpdated} />} />
                <InfoRow icon={ShieldCheck} label="Verification" value={product.verificationStatus || 'Not Submitted'} />
                {product.lastVerificationDate && <InfoRow icon={Calendar} label="Last Verified" value={<RelativeTime date={product.lastVerificationDate} />} />}
            </CardContent>
        </Card>
    )
}

interface OverviewTabProps {
  product: Product;
  customFields?: CustomFieldDefinition[];
}

export default function OverviewTab({ product, customFields }: OverviewTabProps) {
  const hasCustomData =
    product.customData &&
    Object.keys(product.customData).length > 0 &&
    customFields &&
    customFields.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
           <Image
            src={product.productImage}
            alt={product.productName}
            width={600}
            height={600}
            className="rounded-lg border object-cover aspect-square w-full"
            data-ai-hint="product photo"
          />
          <StatusCard product={product} />
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <div className="flex items-start gap-4 py-3 border-b">
                      <Quote className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">Description</p>
                        <p className="text-muted-foreground text-sm">{product.productDescription}</p>
                      </div>
                    </div>
                    {product.gtin && (
                        <InfoRow
                        icon={Fingerprint}
                        label="GTIN"
                        value={<span className="font-mono">{product.gtin}</span>}
                        />
                    )}
                    <InfoRow icon={Tag} label="Category" value={product.category} />
                    <InfoRow
                        icon={Landmark}
                        label="Manufacturer"
                        value={product.supplier}
                    />
                </CardContent>
            </Card>
        </div>
      </div>

      {hasCustomData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListPlus />
              Additional Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customFields.map(field => {
              const value = product.customData?.[field.id];
              if (value === undefined || value === null) return null;

              return (
                <InfoRow
                  key={field.id}
                  icon={ListPlus}
                  label={field.label}
                  value={String(value)}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
