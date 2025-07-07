// src/components/product-tracker-selector.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types';

interface ProductTrackerSelectorProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string | null) => void;
  className?: string;
}

/**
 * A simplified, reliable dropdown for product selection.
 * Replaces the complex combobox to resolve interaction bugs.
 */
export function ProductTrackerSelector({
  products,
  selectedProductId,
  onProductSelect,
  className,
}: ProductTrackerSelectorProps) {
  return (
    <Select
      value={selectedProductId || ''}
      onValueChange={(value: string) => {
        onProductSelect(value === 'clear-selection' ? null : value);
      }}
    >
      <SelectTrigger className={cn('w-full sm:w-[250px]', className)}>
        <SelectValue placeholder="Select a Product..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="clear-selection">Clear Selection</SelectItem>
        {products.map(product => (
          <SelectItem key={product.id} value={product.id}>
            {product.productName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
