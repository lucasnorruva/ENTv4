'use client';

import { useState, useTransition } from 'react';
import { FileText, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
import type { User, Product } from '@/types';
import { generateConformityDeclarationText } from '@/lib/actions';
import { ScrollArea } from './ui/scroll-area';

export default function DocGenerationWidget({
  product,
  user,
}: {
  product: Product;
  user: User;
}) {
  const [isGenerating, startGenerationTransition] = useTransition();
  const [docText, setDocText] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerateDoc = () => {
    startGenerationTransition(async () => {
      try {
        const result = await generateConformityDeclarationText(
          product.id,
          user.id,
        );
        setDocText(result);
        setIsDialogOpen(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate document.',
          variant: 'destructive',
        });
      }
    });
  };

  const copyToClipboard = () => {
    if (docText) {
      navigator.clipboard.writeText(docText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generate Documents</CardTitle>
          <CardDescription>
            Use AI to generate compliance documents based on this passport's
            data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleGenerateDoc}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isGenerating
              ? 'Generating...'
              : 'Generate Declaration of Conformity'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated Declaration of Conformity</DialogTitle>
            <DialogDescription>
              Review the AI-generated document below. You can copy the text to
              your clipboard.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] my-4">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md">
              {docText ? (
                <ReactMarkdown>{docText}</ReactMarkdown>
              ) : (
                <p>No document generated.</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={copyToClipboard}
              disabled={!docText}
            >
              {hasCopied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {hasCopied ? 'Copied!' : 'Copy Text'}
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
