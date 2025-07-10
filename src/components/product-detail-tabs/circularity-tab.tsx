// src/components/product-detail-tabs/circularity-tab.tsx
'use client';

import { Award, BookCheck, Hash } from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <div className="text-muted-foreground text-sm">{value}</div>}
      </div>
    </div>
  );
}

interface CircularityTabProps {
  product: Product;
}

export default function CircularityTab({ product }: CircularityTabProps) {
  const { massBalance } = product;

  if (!massBalance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Circularity & Mass Balance</CardTitle>
          <CardDescription>
            Information about the product's circularity claims and certifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No mass balance information has been allocated to this product.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circularity & Mass Balance</CardTitle>
        <CardDescription>
          Information about the product's circularity claims and certifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoRow
          icon={Award}
          label="Circularity Credits Allocated"
          value={massBalance.creditsAllocated ? `${massBalance.creditsAllocated} Credits` : 'None'}
        />
        <InfoRow
          icon={BookCheck}
          label="Certification Body"
          value={massBalance.certificationBody || 'Not specified'}
        />
        <InfoRow
          icon={Hash}
          label="Certificate Number"
          value={<span className="font-mono text-xs">{massBalance.certificateNumber || 'Not specified'}</span>}
        />
        <p className="text-xs text-muted-foreground mt-4">
          This product's sustainability claims are supported by circularity credits, representing certified recycled or bio-based material input in the value chain via a mass balance approach.
        </p>
      </CardContent>
    </Card>
  );
}
