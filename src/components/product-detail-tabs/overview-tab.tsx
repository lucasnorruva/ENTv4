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
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
  isGeneratingImage: boolean;
  contextImagePreview: string | null;
  handleContextImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateImage: () => void;
}

export default function OverviewTab({
  product,
  isGeneratingImage,
  contextImagePreview,
  handleContextImageChange,
  handleGenerateImage,
}: OverviewTabProps) {
  return (
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
            <div className="grid items-center gap-1.5">
              <Label
                htmlFor="context-image"
                className="text-xs text-muted-foreground"
              >
                Optional: Provide a reference image (e.g., a sketch)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="context-image"
                  type="file"
                  accept="image/*"
                  className="text-xs h-9"
                  onChange={handleContextImageChange}
                  disabled={isGeneratingImage}
                />
                {contextImagePreview && (
                  <Image
                    src={contextImagePreview}
                    alt="Context image preview"
                    width={36}
                    height={36}
                    className="rounded-md object-cover border"
                  />
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGeneratingImage ? 'Generating...' : 'Generate New Image'}
            </Button>
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
                              <Percent className="h-3 w-3" /> {mat.percentage}%
                              of total
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
  );
}
