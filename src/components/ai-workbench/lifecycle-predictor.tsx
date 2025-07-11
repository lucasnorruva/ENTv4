
// src/components/ai-workbench/lifecycle-predictor.tsx
'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import type { Product, User } from '@/types';
import { runLifecyclePrediction, getProducts } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductTrackerSelector } from '../dpp-tracker/product-tracker-selector';
import { Loader2, BrainCircuit, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
);


export default function LifecyclePredictor({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPredicting, startPredictionTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await getProducts(user.id);
        setProducts(prods);
      } catch (error) {
        toast({ title: 'Error', description: 'Could not load products.', variant: 'destructive' });
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, [user.id, toast]);

  const handleProductSelect = useCallback((productId: string | null) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId) || null;
    setSelectedProduct(product);
  }, [products]);

  const handleRunPrediction = useCallback(() => {
    if (!selectedProductId) return;
    
    startPredictionTransition(async () => {
      try {
        const updatedProduct = await runLifecyclePrediction(selectedProductId, user.id);
        setSelectedProduct(updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        toast({
          title: 'Prediction Complete',
          description: 'Lifecycle prediction has been generated.',
        });
      } catch (error: any) {
        toast({
          title: 'Prediction Failed',
          description: error.message || 'An error occurred while running the prediction.',
          variant: 'destructive',
        });
      }
    });
  }, [selectedProductId, user.id, toast]);

  const prediction = selectedProduct?.sustainability?.lifecyclePrediction;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit /> Predictive Lifecycle Analytics
        </CardTitle>
        <CardDescription>
          Select a product to generate AI-powered forecasts about its expected lifespan and key failure points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin" /> : 
          <ProductTrackerSelector products={products} selectedProductId={selectedProductId} onProductSelect={handleProductSelect} />
        }
        <div className="rounded-lg border bg-muted/50 p-4 min-h-[150px] flex flex-col justify-center">
            {isPredicting ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Generating prediction...</p>
                </div>
            ) : prediction ? (
                 <div className='space-y-2'>
                    <InfoItem label="Predicted Lifespan" value={`${prediction.predictedLifespanYears} years`} />
                    <InfoItem label="Optimal Replacement" value={`${prediction.optimalReplacementTimeYears} years`} />
                    <InfoItem label="Confidence" value={`${Math.round(prediction.confidenceScore * 100)}%`} />
                    <div>
                        <p className="text-sm font-semibold mt-3 mb-1">Key Failure Points:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {prediction.keyFailurePoints.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <p>Select a product to generate a prediction.</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRunPrediction} disabled={isPredicting || !selectedProductId}>
          {isPredicting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {prediction ? 'Rerun Prediction' : 'Generate Prediction'}
        </Button>
      </CardFooter>
    </Card>
  );
}
