// src/components/predictive-analytics-widget.tsx
'use client';

import React, { useTransition } from 'react';
import type { Product, User } from '@/types';
import { BrainCircuit, Bot, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { runLifecyclePrediction } from '@/lib/actions';

interface PredictiveAnalyticsWidgetProps {
  product: Product;
  user: User;
  onPredictionComplete: (updatedProduct: Product) => void;
  isAiEnabled: boolean;
}

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
);

export default function PredictiveAnalyticsWidget({ product, user, onPredictionComplete, isAiEnabled }: PredictiveAnalyticsWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRunPrediction = () => {
    startTransition(async () => {
        try {
            const updatedProduct = await runLifecyclePrediction(product.id, user.id);
            onPredictionComplete(updatedProduct);
            toast({
                title: 'Prediction Complete',
                description: 'Lifecycle prediction has been updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Prediction Failed',
                description: error.message || 'An error occurred while running the prediction.',
                variant: 'destructive',
            });
        }
    });
  }

  const prediction = product.sustainability?.lifecyclePrediction;

  if (!isAiEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit />
          Predictive Analytics
        </CardTitle>
        <CardDescription>
          AI-powered forecasts about this product's lifecycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prediction ? (
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
          <p className="text-sm text-muted-foreground text-center py-4">
            No prediction data available. Run the analysis to generate insights.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleRunPrediction} disabled={!isAiEnabled || isPending} className="w-full">
          {isPending ? (
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
