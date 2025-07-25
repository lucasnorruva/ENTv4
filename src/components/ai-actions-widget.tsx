// src/components/ai-actions-widget.tsx
'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ListChecks, FileText, Loader2, FileJson, Award } from 'lucide-react';
import type { Product, User } from '@/types';
import type {
  SuggestImprovementsOutput,
  PcdsOutput,
} from '@/types/ai-outputs';

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
  suggestImprovements,
  generateAndSaveConformityDeclaration,
  generateAndSaveSustainabilityDeclaration,
  generatePcdsForProduct,
  runDataValidationCheck,
  runComplianceCheck,
} from '@/lib/actions/product-ai-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface AiActionsWidgetProps {
  product: Product;
  user: User;
  canRunComplianceCheck: boolean;
  canValidateData: boolean;
  canGenerateDoc: boolean;
  canExportData: boolean;
  isAiEnabled: boolean;
}

export default function AiActionsWidget({
  product,
  user,
  canRunComplianceCheck,
  canValidateData,
  canGenerateDoc,
  canExportData,
  isAiEnabled,
}: AiActionsWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [recommendations, setRecommendations] =
    useState<SuggestImprovementsOutput | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [pcdsData, setPcdsData] = useState<PcdsOutput | null>(null);
  const [isPcdsOpen, setIsPcdsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = useCallback(
    (
      action: () => Promise<any>,
      actionName: string,
      successTitle: string,
      successDescription: string,
    ) => {
      setActiveAction(actionName);
      startTransition(async () => {
        try {
          await action();
          toast({ title: successTitle, description: successDescription });
          router.refresh();
        } catch (err: any) { // The type 'any' is used here temporarily for demonstration.
          toast({
            title: `Error: ${actionName}`,
            description:
              err.message || `Failed to run ${actionName.toLowerCase()}.`,
            variant: 'destructive',
          });
        } finally { // This 'err' variable was unused.
          setActiveAction(null);
        }
      });
    },
    [router, startTransition, toast],
  );

  const handleGetSuggestions = useCallback(() => {
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
        const result = await suggestImprovements(product.id, user.id);
        setRecommendations(result);
        setIsSuggestionsOpen(true); // This 'err' variable was unused.
      } catch (err) {
        toast({
          title: 'Error generating suggestions',
          description: 'Failed to get AI suggestions.',
          variant: 'destructive',
        });
      } finally {
        setActiveAction(null);
      }
    });
  }, [product.id, product.productName, product.productDescription, user.id, toast, startTransition]);

  const handleGeneratePcds = useCallback(() => {
    setActiveAction('pcds');
    startTransition(async () => {
      try {
        const result = await generatePcdsForProduct(product.id, user.id);
        setPcdsData(result);
 setIsPcdsOpen(true);
      } catch (err) {
        toast({
          title: 'Error generating PCDS',
          description: 'Failed to generate PCDS.',
          variant: 'destructive',
        });
      } finally {
        setActiveAction(null);
      }
    });
  }, [product.id, user.id, toast, startTransition]);

  if (!isAiEnabled) {
    return null; // Don't render the widget if AI is disabled for the company
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Actions</CardTitle>
          <CardDescription>
            Use AI to analyze, improve, and generate documents for this
            passport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-2">
            {canRunComplianceCheck && (
              <AccordionItem
                value="compliance"
                className="border rounded-md px-3"
              >
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="font-semibold">Compliance Analysis</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Run an on-demand AI analysis against the product's assigned
                    compliance path.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleAction(
                        () => runComplianceCheck(product.id, user.id),
                        'compliance',
                        'Analysis Complete',
                        'The AI compliance check has finished.',
                      )
                    }
                    disabled={!isAiEnabled || isPending}
                  >
                    {isPending && activeAction === 'compliance' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    {isPending && activeAction === 'compliance'
                      ? 'Analyzing...'
                      : 'Run Compliance Check'}
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
                  <p className="text-xs text-muted-foreground">
                    Run an on-demand AI analysis to check for data quality
                    issues and anomalies.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleAction(
                        () => runDataValidationCheck(product.id, user.id),
                        'validation',
                        'Validation Complete',
                        "The product's warnings have been updated.",
                      )
                    }
                    disabled={!isAiEnabled || isPending}
                    variant="secondary"
                  >
                    {isPending && activeAction === 'validation' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ListChecks className="mr-2 h-4 w-4" />
                    )}
                    {isPending && activeAction === 'validation'
                      ? 'Validating...'
                      : 'Run Data Quality Check'}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem
              value="suggestions"
              className="border rounded-md px-3"
            >
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">AI Suggestions</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Get recommendations to improve this passport's data quality
                  and sustainability profile.
                </p>
                <Button
                  className="w-full"
                  onClick={handleGetSuggestions}
                  disabled={!isAiEnabled || isPending}
                >
                  {isPending && activeAction === 'suggestions' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isPending && activeAction === 'suggestions'
                    ? 'Analyzing...'
                    : 'Generate Suggestions'}
                </Button>
              </AccordionContent>
            </AccordionItem>

            {(canGenerateDoc || canExportData) && (
              <AccordionItem value="docgen" className="border rounded-md px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">Document Generation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Use AI to generate compliance documents based on this
                    passport's data.
                  </p>
                  {canGenerateDoc && (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () =>
                              generateAndSaveConformityDeclaration(
                                product.id,
                                user.id,
                              ),
                            'docgen_conformity',
                            'Document Generated',
                            'The Declaration of Conformity has been saved.',
                          )
                        }
                        disabled={!isAiEnabled || isPending}
                      >
                        {isPending && activeAction === 'docgen_conformity' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        {isPending && activeAction === 'docgen_conformity'
                          ? 'Generating...'
                          : 'Declaration of Conformity'}
                      </Button>
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () =>
                              generateAndSaveSustainabilityDeclaration(
                                product.id,
                                user.id,
                              ),
                            'docgen_sustainability',
                            'Document Generated',
                            'The Sustainability Declaration has been saved.',
                          )
                        }
                        disabled={!isAiEnabled || isPending || !product.massBalance?.certificationBody}
                      >
                        {isPending && activeAction === 'docgen_sustainability' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Award className="mr-2 h-4 w-4" />
                        )}
                        {isPending && activeAction === 'docgen_sustainability'
                          ? 'Generating...'
                          : 'Sustainability Declaration (ISCC)'}
                      </Button>
                    </>
                  )}
                  {canExportData && (
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      onClick={handleGeneratePcds}
                      disabled={!isAiEnabled || isPending}
                    >
                      {isPending && activeAction === 'pcds' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileJson className="mr-2 h-4 w-4" />
                      )}
                      {isPending && activeAction === 'pcds'
                        ? 'Generating...'
                        : 'Generate PCDS'}
                    </Button>
                  )}
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
      <Dialog open={isPcdsOpen} onOpenChange={setIsPcdsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Circularity Data Sheet (PCDS)</DialogTitle>
            <DialogDescription>
              AI-generated circularity data in a standardized JSON format.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full rounded-md border bg-muted p-4">
            <pre className="text-xs">
              {pcdsData ? JSON.stringify(pcdsData, null, 2) : ''}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsPcdsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
