
// src/components/dpp-tracker/RouteAnalysisPanel.tsx
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Loader2, Zap } from 'lucide-react';
import { mockCountryCoordinates } from '@/lib/country-coordinates';

interface RouteAnalysisPanelProps {
  isOpen: boolean;
  products: Product[];
  isAnalyzing: boolean;
  onAnalyze: (productId: string, origin: string, destination: string) => void;
}

const countryOptions = Object.keys(mockCountryCoordinates).sort();

export default function RouteAnalysisPanel({
  isOpen,
  products,
  isAnalyzing,
  onAnalyze,
}: RouteAnalysisPanelProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (selectedProductId && origin && destination) {
      onAnalyze(selectedProductId, origin, destination);
    }
  };

  return (
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>AI Route Risk Analyzer</CardTitle>
        <CardDescription>
          Select a product and a potential route to get an instant risk
          assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Product</label>
            <ProductTrackerSelector
              products={products}
              selectedProductId={selectedProductId}
              onProductSelect={setSelectedProductId}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Origin</label>
            <Select onValueChange={setOrigin} value={origin}>
              <SelectTrigger>
                <SelectValue placeholder="Select Origin" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Destination</label>
            <Select onValueChange={setDestination} value={destination}>
              <SelectTrigger>
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSubmit}
            disabled={!selectedProductId || !origin || !destination || isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Analyze Route
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
