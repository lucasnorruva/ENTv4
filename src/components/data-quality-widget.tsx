// src/components/data-quality-widget.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ListChecks, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { runDataValidationCheck } from '@/lib/actions';
import type { User, Product } from '@/types';

export default function DataQualityWidget({
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
        await runDataValidationCheck(product.id, user.id);
        toast({
          title: 'Data Validation Complete',
          description:
            "The AI data quality check has finished. The product's warnings have been updated.",
        });
        // Refresh the server component to show new data
        router.refresh();
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to run data validation check.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Data Validation</CardTitle>
        <CardDescription>
          Run an on-demand AI analysis to check for data quality issues and
          anomalies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          variant="secondary"
          onClick={handleRunCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ListChecks className="mr-2 h-4 w-4" />
          )}
          {isChecking ? 'Validating...' : 'Run Data Quality Check'}
        </Button>
      </CardContent>
    </Card>
  );
}
