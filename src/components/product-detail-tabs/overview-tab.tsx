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
  ShieldAlert,
} from 'lucide-react';
import type { Product, CustomFieldDefinition } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getStatusBadgeClasses, getStatusBadgeVariant } from '@/lib/dpp-display-utils';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


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
  
  const verificationStatus = product.verificationStatus ?? 'Not Submitted';

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <Image
                src={product.productImage}
                alt={product.productName}
                width={600}
                height={400}
                className="rounded-lg border object-cover aspect-[3/2]"
                data-ai-hint="product photo"
              />
            </div>
            <div className="md:col-span-2 space-y-3 text-sm">
              <InfoRow
                icon={Quote}
                label="Description"
                value={product.productDescription}
              />
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
               <InfoRow icon={ShieldCheck} label="Verification Status">
                    <Badge
                        variant={getStatusBadgeVariant(verificationStatus)}
                        className={cn('capitalize', getStatusBadgeClasses(verificationStatus))}
                    >
                        {verificationStatus === 'Verified' ? <ShieldCheck className="mr-1 h-3 w-3" /> : <ShieldAlert className="mr-1 h-3 w-3" />}
                        {verificationStatus}
                    </Badge>
               </InfoRow>
            </div>
          </div>
        </CardContent>
      </Card>

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
