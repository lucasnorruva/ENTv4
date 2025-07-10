
// src/components/ai-workbench/roi-calculator.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Product, User } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Wrench, Recycle, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ProductTrackerSelector } from '../dpp-tracker/product-tracker-selector';
import { getProducts } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function RoiCalculator({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [recycledContent, setRecycledContent] = useState(0);
  const [repairabilityScore, setRepairabilityScore] = useState(5);

  const [initialRecycledContent, setInitialRecycledContent] = useState(0);
  const [initialRepairabilityScore, setInitialRepairabilityScore] = useState(5);

  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await getProducts(user.id);
        setProducts(prods);
      } catch (error) {
        toast({ title: 'Error', description: 'Could not load products.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [user.id, toast]);

  const handleProductSelect = useCallback((productId: string | null) => {
    const product = products.find(p => p.id === productId) || null;
    setSelectedProduct(product);
    if (product) {
        const initialRecycled = product.materials && product.materials.length > 0
            ? Math.round(product.materials.reduce((sum, m) => sum + (m.recycledContent || 0), 0) / product.materials.length)
            : 0;
        const initialRepair = product.lifecycle?.repairabilityScore || 5;

        setInitialRecycledContent(initialRecycled);
        setRecycledContent(initialRecycled);
        setInitialRepairabilityScore(initialRepair);
        setRepairabilityScore(initialRepair);
    }
  }, [products]);

  const calculateROI = () => {
    if (!selectedProduct) return { materialSavings: 0, complianceSavings: 0, totalRoi: 0 };
    
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
          Estimate the financial impact of improving a product's circularity. Select a product and adjust the sliders to see the potential ROI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        ) : (
            <ProductTrackerSelector products={products} selectedProductId={selectedProduct?.id || null} onProductSelect={handleProductSelect} />
        )}
        
        {selectedProduct && (
            <>
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
                    <span className="font-bold">{repairabilityScore.toFixed(1)}/10</span>
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
                    <h4 className="font-semibold">Projected Impact (3-Year) for {selectedProduct.productName}</h4>
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
            </>
        )}
      </CardContent>
    </Card>
  );
}
