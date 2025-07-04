// src/components/ai-actions-widget.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ListChecks, FileText, Loader2 } from 'lucide-react';
import type { Product, User } from '@/types';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  runComplianceCheck,
  runDataValidationCheck,
  suggestImprovements,
  generateAndSaveConformityDeclaration,
} from '@/lib/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface AiActionsWidgetProps {
  product: Product;
  user: User;
  canRunComplianceCheck: boolean;
  canValidateData: boolean;
  canGenerateDoc: boolean;
}

export default function AiActionsWidget({
  product,
  user,
  canRunComplianceCheck,
  canValidateData,
  canGenerateDoc,
}: AiActionsWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SuggestImprovementsOutput | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = (action: () => Promise<any>, actionName: string, successTitle: string, successDescription: string) => {
    setActiveAction(actionName);
    startTransition(async () => {
      try {
        await action();
        toast({ title: successTitle, description: successDescription });
        router.refresh();
      } catch (error: any) {
        toast({
          title: `Error: ${actionName}`,
          description: error.message || `Failed to run ${actionName.toLowerCase()}.`,
          variant: 'destructive',
        });
      } finally {
        setActiveAction(null);
      }
    });
  };
  
  const handleGetSuggestions = () => {
    if (!product.productName || !product.productDescription) {
      toast({
        title: 'Missing Information',
        description: 'Product needs a name and description for suggestions.',
        variant: 'destructive',
      });
      return;
    }
    setActiveAction('suggestions');
    startTransition(async () => {
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
      } finally {
        setActiveAction(null);
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Actions</CardTitle>
          <CardDescription>
            Use AI to analyze, improve, and generate documents for this passport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-2">
            {canRunComplianceCheck && (
              <AccordionItem value="compliance" className="border rounded-md px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="font-semibold">Compliance Analysis</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Run an on-demand AI analysis against the product's assigned compliance path.</p>
                  <Button
                    className="w-full"
                    onClick={() => handleAction(() => runComplianceCheck(product.id, user.id), 'compliance', 'Analysis Complete', 'The AI compliance check has finished.')}
                    disabled={isPending}
                  >
                    {isPending && activeAction === 'compliance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    {isPending && activeAction === 'compliance' ? 'Analyzing...' : 'Run Compliance Check'}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}

            {canValidateData && (
                <AccordionItem value="quality" className="border rounded-md px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    <span className="font-semibold">Data Validation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Run an on-demand AI analysis to check for data quality issues and anomalies.</p>
                  <Button
                    className="w-full"
                    onClick={() => handleAction(() => runDataValidationCheck(product.id, user.id), 'validation', 'Validation Complete', "The product's warnings have been updated.")}
                    disabled={isPending}
                    variant="secondary"
                  >
                    {isPending && activeAction === 'validation' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                    {isPending && activeAction === 'validation' ? 'Validating...' : 'Run Data Quality Check'}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}
            
            <AccordionItem value="suggestions" className="border rounded-md px-3">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">AI Suggestions</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">Get recommendations to improve this passport's data quality and sustainability profile.</p>
                 <Button
                    className="w-full"
                    onClick={handleGetSuggestions}
                    disabled={isPending}
                 >
                    {isPending && activeAction === 'suggestions' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isPending && activeAction === 'suggestions' ? 'Analyzing...' : 'Generate Suggestions'}
                </Button>
              </AccordionContent>
            </AccordionItem>

            {canGenerateDoc && (
              <AccordionItem value="docgen" className="border rounded-md px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">Document Generation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Use AI to generate compliance documents based on this passport's data.</p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction(() => generateAndSaveConformityDeclaration(product.id, user.id), 'docgen', 'Document Generated', 'The Declaration of Conformity has been saved.')}
                    disabled={isPending}
                  >
                    {isPending && activeAction === 'docgen' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    {isPending && activeAction === 'docgen' ? 'Generating...' : 'Generate Declaration of Conformity'}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
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
