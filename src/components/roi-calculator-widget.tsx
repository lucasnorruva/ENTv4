// src/components/roi-calculator-widget.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { Product } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Wrench, Recycle } from 'lucide-react';
import { Badge } from './ui/badge';

interface RoiCalculatorWidgetProps {
  product: Product;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function RoiCalculatorWidget({ product }: RoiCalculatorWidgetProps) {
  const initialRecycledContent = useMemo(() => {
    if (!product.materials || product.materials.length === 0) return 0;
    const totalPercentage = product.materials.reduce(
      (sum, m) => sum + (m.percentage || 0),
      0,
    );
    if (totalPercentage === 0) return 0;
    const weightedRecycled = product.materials.reduce(
      (sum, m) =>
        sum + (m.recycledContent || 0) * (m.percentage || 0) / 100,
      0,
    );
    return Math.round((weightedRecycled / totalPercentage) * 100);
  }, [product.materials]);
  
  const initialRepairabilityScore = product.lifecycle?.repairabilityScore || 5;

  const [recycledContent, setRecycledContent] = useState(initialRecycledContent);
  const [repairabilityScore, setRepairabilityScore] = useState(initialRepairabilityScore);

  const calculateROI = () => {
    // Simplified financial model for demonstration
    const materialSavings = (recycledContent - initialRecycledContent) * 500;
    const complianceSavings = (repairabilityScore - initialRepairabilityScore) * 1000;
    const premiumPricing = (recycledContent * 50) + (repairabilityScore * 100);

    const totalRoi = materialSavings + complianceSavings + premiumPricing;
    return { materialSavings, complianceSavings, totalRoi };
  };

  const { materialSavings, complianceSavings, totalRoi } = calculateROI();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp /> Sustainability ROI Calculator
        </CardTitle>
        <CardDescription>
          Estimate the financial impact of improving your product's circularity. Adjust the sliders to see the potential ROI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="recycled-content-slider" className="flex items-center gap-2"><Recycle className="h-4 w-4"/> Average Recycled Content</Label>
            <span className="font-bold">{recycledContent}%</span>
          </div>
          <Slider
            id="recycled-content-slider"
            value={[recycledContent]}
            onValueChange={(value) => setRecycledContent(value[0])}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="repairability-slider" className="flex items-center gap-2"><Wrench className="h-4 w-4"/> Repairability Score</Label>
            <span className="font-bold">{repairabilityScore}/10</span>
          </div>
          <Slider
            id="repairability-slider"
            value={[repairabilityScore]}
            onValueChange={(value) => setRepairabilityScore(value[0])}
            max={10}
            step={0.1}
          />
        </div>
        <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">Projected Impact (3-Year)</h4>
            <div className="flex justify-between items-center text-sm">
                <p>Material Cost Savings:</p>
                <p className="font-medium">{formatCurrency(materialSavings)}</p>
            </div>
             <div className="flex justify-between items-center text-sm">
                <p>Compliance & Risk Reduction Savings:</p>
                <p className="font-medium">{formatCurrency(complianceSavings)}</p>
            </div>
             <div className="flex justify-between items-center text-lg">
                <p className="font-bold">Total Estimated ROI:</p>
                <Badge className="text-lg bg-primary/20 text-primary hover:bg-primary/30 border-primary/40">
                    {formatCurrency(totalRoi)}
                </Badge>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
