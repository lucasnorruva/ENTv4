// src/components/doc-generation-widget.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User, Product } from '@/types';
import { generateAndSaveConformityDeclaration } from '@/lib/actions';

export default function DocGenerationWidget({
  product,
  user,
}: {
  product: Product;
  user: User;
}) {
  const [isGenerating, startGenerationTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateDoc = () => {
    startGenerationTransition(async () => {
      try {
        await generateAndSaveConformityDeclaration(product.id, user.id);
        toast({
          title: 'Document Generated',
          description:
            'The Declaration of Conformity has been saved to the passport and is now visible in the Compliance tab.',
        });
        router.refresh(); // This will re-fetch server components and update the view
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate document.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Documents</CardTitle>
        <CardDescription>
          Use AI to generate compliance documents based on this passport's data.
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
  );
}
