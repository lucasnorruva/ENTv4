
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
import { ProductTrackerSelector } from '@/components/dpp-tracker/product-tracker-selector';
import type { Product } from '@/types';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { X, AlertTriangle, Factory, Zap } from 'lucide-react';

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
  showFactories: boolean;
  onToggleFactories: (checked: boolean) => void;
  showCustomsAlerts: boolean;
  onToggleCustomsAlerts: (checked: boolean) => void;
  onToggleAnalyzer: () => void;
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
  showFactories,
  onToggleFactories,
  showCustomsAlerts,
  onToggleCustomsAlerts,
  onToggleAnalyzer,
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
      </div>
      <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg backdrop-blur-sm flex-wrap">
        <Select onValueChange={onCountryFilterChange} value={countryFilter}>
          <SelectTrigger className="w-full sm:w-auto h-8 text-xs">
            <SelectValue placeholder="Filter Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="eu">EU Countries</SelectItem>
            <SelectItem value="supplyChain" disabled={!selectedProductId}>
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
          <Label htmlFor="factories-toggle" className="text-xs flex items-center gap-1">
            <Factory className="h-3 w-3" />
            Factories
          </Label>
        </div>
        <div className="flex items-center space-x-2 pl-2">
          <Switch
            id="alerts-toggle"
            checked={showCustomsAlerts}
            onCheckedChange={onToggleCustomsAlerts}
          />
          <Label htmlFor="alerts-toggle" className="text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Alerts
          </Label>
        </div>
         <Button
          size="sm"
          variant="outline"
          onClick={onToggleAnalyzer}
          className="h-8"
        >
          <Zap className="mr-1 h-3.5 w-3.5" />
          AI Analyzer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleRotation}
          className="h-8"
        >
          {isAutoRotating ? 'Stop Rotation' : 'Auto-Rotate'}
        </Button>
        {selectedProductId && (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onProductSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
