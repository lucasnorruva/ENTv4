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
import RouteSimulator from './RouteSimulator';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface GlobeControlsProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string | null) => void;
  countryFilter: 'all' | 'eu' | 'supplyChain';
  onCountryFilterChange: (value: 'all' | 'eu' | 'supplyChain') => void;
  riskFilter: 'all' | 'High' | 'Medium' | 'Low';
  onRiskFilterChange: (value: 'all' | 'High' | 'Medium' | 'Low') => void;
  isAutoRotating: boolean;
  onToggleRotation: () => void;
  isProductSelected: boolean;
  onSimulateRoute: (origin: string, destination: string) => void;
  isSimulating: boolean;
  showFactories: boolean;
  onToggleFactories: (checked: boolean) => void;
}

export default function GlobeControls({
  products,
  selectedProductId,
  onProductSelect,
  countryFilter,
  onCountryFilterChange,
  riskFilter,
  onRiskFilterChange,
  isAutoRotating,
  onToggleRotation,
  isProductSelected,
  onSimulateRoute,
  isSimulating,
  showFactories,
  onToggleFactories,
}: GlobeControlsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <ProductTrackerSelector
          products={products}
          selectedProductId={selectedProductId}
          onProductSelect={onProductSelect}
          className="w-full sm:w-[300px] bg-background/80 backdrop-blur-sm"
        />
        <RouteSimulator
          onSimulate={onSimulateRoute}
          isSimulating={isSimulating}
        />
      </div>
      <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg backdrop-blur-sm">
        <Select onValueChange={onCountryFilterChange} value={countryFilter}>
          <SelectTrigger className="w-full sm:w-auto h-8 text-xs">
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
        <Select onValueChange={onRiskFilterChange as any} value={riskFilter}>
          <SelectTrigger className="w-full sm:w-auto h-8 text-xs">
            <SelectValue placeholder="Filter by Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="High">High Risk</SelectItem>
            <SelectItem value="Medium">Medium Risk</SelectItem>
            <SelectItem value="Low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
         <div className="flex items-center space-x-2 pl-2">
          <Switch
            id="factories-toggle"
            checked={showFactories}
            onCheckedChange={onToggleFactories}
          />
          <Label htmlFor="factories-toggle" className="text-xs">
            Factories
          </Label>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleRotation}
          className="h-8"
        >
          {isAutoRotating ? 'Stop Rotation' : 'Auto-Rotate'}
        </Button>
      </div>
    </div>
  );
}
