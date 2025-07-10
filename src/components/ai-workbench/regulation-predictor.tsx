
// src/components/ai-workbench/regulation-predictor.tsx
'use client';

import React, { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BrainCircuit, Loader2, Telescope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runDailyReferenceDataSync } from '@/lib/actions';
import type { User } from '@/types';

interface PredictionResult {
  syncedItems: number;
  updatedRegulations: string[];
  details: string;
}

export default function RegulationPredictor({ user }: { user: User }) {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRunPrediction = () => {
    startTransition(async () => {
      setResult(null);
      try {
        const predictionResult = await runDailyReferenceDataSync();
        setResult(predictionResult);
        toast({
          title: 'Prediction Complete',
          description: 'The regulatory landscape has been analyzed.',
        });
      } catch (error: any) {
        toast({
          title: 'Prediction Failed',
          description: error.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Telescope /> Regulatory Change Prediction Engine
        </CardTitle>
        <CardDescription>
          Simulate an AI-powered analysis of news and policy signals to predict
          upcoming regulatory changes and automatically update compliance
          paths.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        {result ? (
          <Alert>
            <BrainCircuit className="h-4 w-4" />
            <AlertTitle>Analysis Result</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{result.details}</p>
              {result.updatedRegulations.length > 0 && (
                <div>
                  <p className="font-semibold">Updated Path:</p>
                  <Badge variant="secondary">
                    {result.updatedRegulations[0]}
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-center text-muted-foreground pt-8">
            Click the button below to run the prediction engine.
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button onClick={handleRunPrediction} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Prediction Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}
