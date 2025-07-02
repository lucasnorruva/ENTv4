// src/components/ai-suggestions-widget.tsx
'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';
import type { Product } from '@/types';

export default function AiSuggestionsWidget({ product }: { product: Product }) {
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [recommendations, setRecommendations] =
    useState<SuggestImprovementsOutput | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = () => {
    if (!product.productName || !product.productDescription) {
      toast({
        title: 'Missing Information',
        description: 'Product needs a name and description for suggestions.',
        variant: 'destructive',
      });
      return;
    }

    startSuggestionTransition(async () => {
      try {
        const result = await suggestImprovements({
          productName: product.productName,
          productDescription: product.productDescription,
        });
        setRecommendations(result);
        setIsSuggestionsOpen(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to get AI suggestions.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Suggestions</CardTitle>
          <CardDescription>
            Get recommendations to improve this passport's data quality and
            sustainability profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleGetSuggestions}
            disabled={isSuggesting}
          >
            {isSuggesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isSuggesting ? 'Analyzing...' : 'Generate Suggestions'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Recommendations</DialogTitle>
            <DialogDescription>
              Here are some AI-generated suggestions to improve this product's
              passport.
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto p-1">
            {recommendations?.recommendations &&
            recommendations.recommendations.length > 0 ? (
              <ul className="list-disc pl-5">
                {recommendations.recommendations.map((rec, index) => (
                  <li key={index} className="mb-2">
                    <strong>{rec.type}:</strong> {rec.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No specific recommendations generated at this time.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuggestionsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
