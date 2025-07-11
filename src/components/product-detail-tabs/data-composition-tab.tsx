
// src/components/product-detail-tabs/data-composition-tab.tsx
'use client';

import React from 'react';
import {
  Factory,
  Scale,
  Recycle,
  MapPin,
  Percent,
  Package,
  BatteryCharging,
} from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        {value && (
          <div className="text-muted-foreground text-sm">{value}</div>
        )}
        {children}
      </div>
    </div>
  );
}

interface DataCompositionTabProps {
  product: Product;
}

export default function DataCompositionTab({ product }: DataCompositionTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Physical Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow icon={Scale} label="Material Composition">
            {product.materials.length > 0 ? (
              <div className="space-y-3 mt-2">
                {product.materials.map((mat, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-foreground">{mat.name}</p>
                    <div className="flex gap-4 text-muted-foreground text-xs">
                      {mat.percentage !== undefined && (
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3" /> {mat.percentage}% of total
                        </span>
                      )}
                      {mat.recycledContent !== undefined && (
                        <span className="flex items-center gap-1">
                          <Recycle className="h-3 w-3" /> {mat.recycledContent}% recycled
                        </span>
                      )}
                      {mat.origin && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Origin: {mat.origin}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No material data provided.
              </p>
            )}
          </InfoRow>
          {product.battery && (
            <InfoRow
              icon={BatteryCharging}
              label="Battery"
              value={`${product.battery.type || 'N/A'}${
                product.battery.capacityMah ? `, ${product.battery.capacityMah}mAh` : ''
              }`}
            >
              <p className="text-xs text-muted-foreground">
                Removable: {product.battery.isRemovable ? 'Yes' : 'No'}
              </p>
            </InfoRow>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing &amp; Packaging</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow icon={Factory} label="Manufacturing">
            <p className="text-sm text-muted-foreground">
              {product.manufacturing?.facility} in{' '}
              {product.manufacturing?.country}
            </p>
            {product.manufacturing?.manufacturingProcess &&
                <p className="text-xs text-muted-foreground mt-1">Process: {product.manufacturing.manufacturingProcess}</p>
            }
          </InfoRow>
          <InfoRow icon={Package} label="Packaging">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Type: {product.packaging?.type}</p>
              <p>Recyclable: {product.packaging?.recyclable ? 'Yes' : 'No'}</p>
              {product.packaging?.weight && <p>Weight: {product.packaging.weight}g</p>}
              {product.packaging?.recycledContent !== undefined && <p>Recycled Content: {product.packaging.recycledContent}%</p>}
            </div>
          </InfoRow>
        </CardContent>
      </Card>
    </div>
  );
}
