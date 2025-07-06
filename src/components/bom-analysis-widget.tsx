// src/components/bom-analysis-widget.tsx
'use client';

import React, { useState, useTransition } from 'react';
import {
  FileScan,
  Loader2,
  Sparkles,
  ListPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeBillOfMaterials } from '@/lib/actions/product-actions';
import type { ProductFormValues } from '@/lib/schemas';
import type { AnalyzeBomOutput } from '@/types/ai-outputs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BomAnalysisWidgetProps {
  onApply: (materials: ProductFormValues['materials']) => void;
}

export default function BomAnalysisWidget({ onApply }: BomAnalysisWidgetProps) {
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [bomText, setBomText] = useState('');
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeBomOutput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!bomText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please paste your Bill of Materials text.',
        variant: 'destructive',
      });
      return;
    }
    startAnalysisTransition(async () => {
      try {
        const result = await analyzeBillOfMaterials(bomText);
        setAnalysisResult(result);
        setIsDialogOpen(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to analyze BOM.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleApply = () => {
    if (analysisResult?.materials) {
      const newMaterials = analysisResult.materials.map(m => ({
        name: m.name || '',
        percentage: m.percentage || 0,
        recycledContent: 0,
        origin: m.origin || '',
      }));
      onApply(newMaterials);
      toast({
        title: 'BOM Applied',
        description: 'Materials have been added to the form.',
      });
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-2 border p-4 rounded-lg bg-muted/50">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Powered BOM Parser
        </h4>
        <p className="text-xs text-muted-foreground">
          Paste your unstructured Bill of Materials below and let AI structure it
          for you.
        </p>
        <Textarea
          placeholder="E.g., Aluminum Chassis - 50%, Gorilla Glass Screen - 20%, Lithium-ion Battery..."
          value={bomText}
          onChange={e => setBomText(e.target.value)}
          className="bg-background"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileScan className="mr-2 h-4 w-4" />
          )}
          Analyze BOM
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analyzed Bill of Materials</DialogTitle>
            <DialogDescription>
              Review the extracted materials. You can apply them to your product
              form, replacing any existing materials.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <ShadTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Material/Component</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Origin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResult?.materials.map((mat, index) => (
                  <TableRow key={index}>
                    <TableCell>{mat.name}</TableCell>
                    <TableCell>{mat.percentage ?? 'N/A'}</TableCell>
                    <TableCell>{mat.origin ?? 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ShadTable>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApply}>
              <ListPlus className="mr-2 h-4 w-4" />
              Apply to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
