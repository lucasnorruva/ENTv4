// src/components/product-detail-tabs/overview-tab.tsx
'use client';

import Image from 'next/image';
import {
  Package,
  Scale,
  Factory,
  Fingerprint,
  Quote,
  Tag,
  Landmark,
  Percent,
  Recycle,
  MapPin,
  ListPlus,
} from 'lucide-react';
import type { Product, CustomFieldDefinition } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
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
            </div>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue="data"
            className="w-full mt-4"
          >
            <AccordionItem value="data">
              <AccordionTrigger>
                Materials, Manufacturing & Packaging
              </AccordionTrigger>
              <AccordionContent>
                <InfoRow icon={Factory} label="Manufacturing">
                  <p className="text-sm text-muted-foreground">
                    {product.manufacturing?.facility} in{' '}
                    {product.manufacturing?.country}
                  </p>
                </InfoRow>
                <InfoRow icon={Scale} label="Material Composition">
                  {product.materials.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {product.materials.map((mat, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-foreground">
                            {mat.name}
                          </p>
                          <div className="flex gap-4 text-muted-foreground text-xs">
                            {mat.percentage !== undefined && (
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />{' '}
                                {mat.percentage}% of total
                              </span>
                            )}
                            {mat.recycledContent !== undefined && (
                              <span className="flex items-center gap-1">
                                <Recycle className="h-3 w-3" />{' '}
                                {mat.recycledContent}% recycled
                              </span>
                            )}
                            {mat.origin && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Origin:{' '}
                                {mat.origin}
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
                <InfoRow icon={Package} label="Packaging">
                  <p className="text-sm text-muted-foreground">
                    {product.packaging?.type}
                    {product.packaging?.weight &&
                      ` (${product.packaging.weight}g)`}
                    . Recyclable:{' '}
                    {product.packaging?.recyclable ? 'Yes' : 'No'}.
                  </p>
                </InfoRow>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
