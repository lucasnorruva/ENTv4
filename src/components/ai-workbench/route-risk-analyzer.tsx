// src/components/ai-workbench/route-risk-analyzer.tsx
'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import type { Product, User } from '@/types';
import { analyzeSimulatedTransitRoute, getProducts } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Ship, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockCountryCoordinates } from '@/lib/country-coordinates';
import { ProductTrackerSelector } from '../dpp-tracker/product-tracker-selector';
import { cn } from '@/lib/utils';

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

interface RiskResult {
  riskLevel: RiskLevel;
  summary: string;
  keyConsiderations: string[];
}

const RiskLevelBadge = ({ level }: { level: RiskLevel }) => {
  const Icon = level === 'Low' ? ShieldCheck : ShieldAlert;
  const colorClass = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    'Very High': 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
  };
  return (
    <Badge variant={'outline'} className={cn('capitalize text-lg', colorClass[level])}>
      <Icon className="mr-2 h-4 w-4" />
      {level} Risk
    </Badge>
  );
};

export default function RouteRiskAnalyzer({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const { toast } = useToast();

  const countryOptions = Object.keys(mockCountryCoordinates).sort();

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

  const handleAnalyze = useCallback(() => {
    if (!selectedProductId || !origin || !destination) {
      toast({ title: 'Missing Information', description: 'Please select a product, origin, and destination.', variant: 'destructive' });
      return;
    }
    setResult(null);
    startAnalysisTransition(async () => {
      try {
        const analysisResult = await analyzeSimulatedTransitRoute(selectedProductId, origin, destination, user.id);
        setResult(analysisResult);
        toast({ title: 'Analysis Complete', description: 'The route risk has been assessed.' });
      } catch (error: any) {
        toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
      }
    });
  }, [selectedProductId, origin, destination, user.id, startAnalysisTransition, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship /> Supply Chain Route Risk Analyzer
        </CardTitle>
        <CardDescription>
          Select a product and a potential route to get an AI-powered risk assessment for customs, logistics, and regulatory hurdles.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-select">Product</Label>
            {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin" /> :
              <ProductTrackerSelector products={products} selectedProductId={selectedProductId} onProductSelect={setSelectedProductId} />
            }
          </div>
          <div>
            <Label htmlFor="origin-select">Origin Country</Label>
            <Select onValueChange={(value) => setOrigin(value === 'clear-selection' ? '' : value)} value={origin}>
              <SelectTrigger id="origin-select"><SelectValue placeholder="Select Origin" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="clear-selection">Clear Selection</SelectItem>
                  {countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="destination-select">Destination Country</Label>
            <Select onValueChange={(value) => setDestination(value === 'clear-selection' ? '' : value)} value={destination}>
              <SelectTrigger id="destination-select"><SelectValue placeholder="Select Destination" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="clear-selection">Clear Selection</SelectItem>
                  {countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/50 p-4 min-h-[250px] flex flex-col">
          {isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Analyzing route...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">AI Risk Assessment</h4>
                <RiskLevelBadge level={result.riskLevel} />
              </div>
              <p className="text-sm text-muted-foreground italic">{result.summary}</p>
              <div>
                <h5 className="font-semibold mb-1">Key Considerations:</h5>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.keyConsiderations.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>No analysis run yet.</p>
                <p className="text-xs">Select a product and route to begin.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !selectedProductId || !origin || !destination}>
          {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Analyze Route
        </Button>
      </CardFooter>
    </Card>
  );
}
