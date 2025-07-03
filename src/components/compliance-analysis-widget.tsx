// src/components/compliance-analysis-widget.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { runComplianceCheck } from '@/lib/actions';
import type { User, Product } from '@/types';
import { format } from 'date-fns';

export default function ComplianceAnalysisWidget({
  product,
  user,
}: {
  product: Product;
  user: User;
}) {
  const [isChecking, startCheckTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleRunCheck = () => {
    startCheckTransition(async () => {
      try {
        await runComplianceCheck(product.id, user.id);
        toast({
          title: 'Analysis Complete',
          description:
            'The AI compliance check has finished. The results are now displayed.',
        });
        // Refresh the server component to show new data
        router.refresh(); 
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to run compliance check.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Compliance Analysis</CardTitle>
        <CardDescription>
          Run an on-demand AI analysis against the product's assigned compliance path.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {product.lastVerificationDate && (
          <p className="text-xs text-muted-foreground mb-4">
            Last checked: {format(new Date(product.lastVerificationDate), 'PPpp')}
          </p>
        )}
        <Button
          className="w-full"
          onClick={handleRunCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {isChecking ? 'Analyzing...' : 'Run AI Compliance Check'}
        </Button>
      </CardContent>
    </Card>
  );
}
