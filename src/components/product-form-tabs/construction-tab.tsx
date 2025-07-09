
// src/components/product-form-tabs/construction-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Bot, Loader2, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductFormValues } from '@/lib/schemas';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useCallback } from 'react';
import { analyzeConstructionData } from '@/lib/actions/product-ai-actions';

interface ConstructionTabProps {
  form: UseFormReturn<ProductFormValues>;
  user: User;
  productId?: string;
  isAiEnabled: boolean;
}

export default function ConstructionTab({ form, user, productId, isAiEnabled }: ConstructionTabProps) {
  const { toast } = useToast();
  const [isAnalyzing, startAnalysisTransition] = useTransition();

  const handleAnalyze = useCallback(() => {
    if (!productId) {
      toast({ title: 'Please save the product first.', variant: 'destructive' });
      return;
    }
    
    const materials = form.getValues('materials');
    if (!materials || materials.length === 0) {
      toast({ title: 'Please add at least one material to analyze.', variant: 'destructive' });
      return;
    }

    startAnalysisTransition(async () => {
      try {
        await analyzeConstructionData(productId, user.id);
        toast({ title: 'Analysis Complete', description: 'Construction properties have been analyzed. Refresh the product detail page to see results.' });
      } catch (error: any) {
        toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
      }
    });
  }, [productId, toast, form, startAnalysisTransition, user.id]);

  return (
    <div className="p-6 space-y-6">
       <div className="space-y-2 border p-4 rounded-lg bg-muted/50 text-center">
            <div className="mx-auto w-fit bg-primary/10 p-3 rounded-full mb-2">
                <Hammer className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Construction Material Analysis</h3>
            <p className="text-sm text-muted-foreground">
                This tab is for construction-specific actions. After adding materials and manufacturing details in the 'Data' tab, you can trigger an AI analysis here.
            </p>
            {isAiEnabled ? (
            <div className="pt-4">
                <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                    Analyze Construction Properties with AI
                </Button>
            </div>
             ) : (
                <p className="text-sm text-destructive pt-4">AI features are disabled for this company.</p>
             )}
       </div>
    </div>
  );
}
