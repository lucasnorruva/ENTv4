// src/components/product-form-tabs/textile-tab.tsx
'use client';

import type { UseFormReturn, FieldArrayWithId, UseFieldArrayReturn } from 'react-hook-form';
import { Plus, Trash2, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProductFormValues } from '@/lib/schemas';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { analyzeTextileData } from '@/lib/actions/product-ai-actions';

interface TextileTabProps {
  form: UseFormReturn<ProductFormValues>;
  fiberFields: FieldArrayWithId<ProductFormValues, "textile.fiberComposition", "id">[];
  appendFiber: UseFieldArrayReturn<ProductFormValues, "textile.fiberComposition">["append"];
  removeFiber: UseFieldArrayReturn<ProductFormValues, "textile.fiberComposition">["remove"];
  user: User;
  productId?: string;
  isAiEnabled: boolean;
}

export default function TextileTab({ form, fiberFields, appendFiber, removeFiber, user, productId, isAiEnabled }: TextileTabProps) {
  const { toast } = useToast();
  const [isAnalyzing, startAnalysisTransition] = useTransition();

  const handleAnalyze = () => {
    if (!productId) {
      toast({ title: 'Please save the product first.', variant: 'destructive' });
      return;
    }
    const textileData = form.getValues('textile');
    if (!textileData?.fiberComposition || textileData.fiberComposition.length === 0) {
      toast({ title: 'Please add at least one fiber to analyze.', variant: 'destructive' });
      return;
    }

    startAnalysisTransition(async () => {
      try {
        await analyzeTextileData(productId, user.id);
        toast({ title: 'Analysis Complete', description: 'Textile data has been analyzed. Refresh the product detail page to see results.' });
        // The results are saved on the backend, a page refresh on detail view will show them.
      } catch (error: any) {
        toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
       <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Fiber Composition</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendFiber({ name: '', percentage: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Fiber
            </Button>
        </div>
        <div className="space-y-4">
            {fiberFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end border p-4 rounded-md relative">
                <FormField
                    control={form.control}
                    name={`textile.fiberComposition.${index}.name`}
                    render={({ field }) => (
                        <FormItem className='flex-grow'>
                            <FormLabel>Fiber Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Organic Cotton" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`textile.fiberComposition.${index}.percentage`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Percentage (%)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 80" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFiber(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            ))}
        </div>
        <FormField
            control={form.control}
            name="textile.dyeProcess"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Dyeing Process</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the dyeing process, materials, and certifications..." {...field} />
                    </FormControl>
                    <FormDescription>Mention any certifications like Oeko-Tex or ZDHC if applicable.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="textile.weaveType"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Weave Type (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Jersey, Twill, Satin" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        {isAiEnabled && (
            <div className="pt-4 border-t">
                <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                    Analyze Textile Data with AI
                </Button>
            </div>
        )}
    </div>
  );
}
