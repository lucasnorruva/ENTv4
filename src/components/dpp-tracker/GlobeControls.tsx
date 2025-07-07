// src/components/dpp-tracker/GlobeControls.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { ProductTrackerSelector } from '@/components/product-tracker-selector';
import type { Product } from '@/types';

interface GlobeControlsProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string | null) => void;
  countryFilter: 'all' | 'eu' | 'supplyChain';
  onCountryFilterChange: (value: 'all' | 'eu' | 'supplyChain') => void;
  isAutoRotating: boolean;
  onToggleRotation: () => void;
  isProductSelected: boolean;
  isSelectorOpen: boolean; // New prop
  onSelectorOpenChange: (open: boolean) => void; // New prop
}

export default function GlobeControls({
  products,
  selectedProductId,
  onProductSelect,
  countryFilter,
  onCountryFilterChange,
  isAutoRotating,
  onToggleRotation,
  isProductSelected,
  isSelectorOpen,
  onSelectorOpenChange,
}: GlobeControlsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="bg-background/80 p-2 rounded-lg backdrop-blur-sm">
        <ProductTrackerSelector
          products={products}
          selectedProductId={selectedProductId}
          onProductSelect={onProductSelect}
          className="w-full sm:w-[300px]"
          open={isSelectorOpen}
          onOpenChange={onSelectorOpenChange}
        />
      </div>
      <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg backdrop-blur-sm">
        <Select
          onValueChange={onCountryFilterChange}
          value={countryFilter}
        >
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue placeholder="Filter Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="eu">EU Countries</SelectItem>
            <SelectItem value="supplyChain" disabled={!isProductSelected}>
              Product Focus
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleRotation}
        >
          {isAutoRotating ? 'Stop Rotation' : 'Auto-Rotate'}
        </Button>
      </div>
    </div>
  );
}
