
// src/components/product-form-tabs/food-tab.tsx
'use client';

import type { UseFormReturn, FieldArrayWithId, UseFieldArrayReturn } from 'react-hook-form';
import { Plus, Trash2, Bot, Loader2, Wheat } from 'lucide-react';
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
import type { ProductFormValues } from '@/lib/schemas';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { analyzeFoodSafetyData } from '@/lib/actions/product-ai-actions';

interface FoodTabProps {
  form: UseFormReturn<ProductFormValues>;
  user: User;
  productId?: string;
  isAiEnabled: boolean;
}

export default function FoodTab({ form, user, productId, isAiEnabled }: FoodTabProps) {
  const { toast } = useToast();
  const [isAnalyzing, startAnalysisTransition] = useTransition();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'foodSafety.ingredients',
  });

  const handleAnalyze = () => {
    if (!productId) {
      toast({ title: 'Please save the product first.', variant: 'destructive' });
      return;
    }
    
    const ingredients = form.getValues('foodSafety.ingredients');
    if (!ingredients || ingredients.length === 0) {
      toast({ title: 'Please add at least one ingredient to analyze.', variant: 'destructive' });
      return;
    }

    startAnalysisTransition(async () => {
      try {
        await analyzeFoodSafetyData(productId, user.id);
        toast({ title: 'Analysis Complete', description: 'Food safety data has been analyzed. Refresh the product detail page to see results.' });
      } catch (error: any) {
        toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
       <div className="space-y-4 border p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Wheat />Ingredients</h3>
                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: '' })}
                >
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                </Button>
            </div>
            <FormDescription>List all ingredients in the product.</FormDescription>
            
            <div className="space-y-2">
                {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                    <FormField
                        control={form.control}
                        name={`foodSafety.ingredients.${index}.value`}
                        render={({ field }) => (
                            <FormItem className='flex-grow'>
                                <FormControl>
                                    <Input placeholder="e.g. Enriched Flour" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                ))}
            </div>
       </div>

        <FormField
            control={form.control}
            name="foodSafety.allergens"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Allergen Statement</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Contains Wheat and Soy. May contain traces of nuts." {...field} />
                    </FormControl>
                    <FormDescription>Provide a clear statement about any potential allergens.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {isAiEnabled && (
            <div className="pt-4 border-t">
                <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                    Analyze Food Safety with AI
                </Button>
            </div>
        )}
    </div>
  );
}
