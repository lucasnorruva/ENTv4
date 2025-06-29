'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/lib/types';
import { saveProduct, runEnhancement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  productImage: z.string().url('Must be a valid URL'),
  currentInformation: z.string().refine(
    val => {
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ),
  status: z.enum(['Published', 'Draft', 'Archived']),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface PassportFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onSave: (product: Product) => void;
}

export default function PassportForm({ isOpen, onOpenChange, product, onSave }: PassportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      productImage: 'https://placehold.co/100x100.png',
      currentInformation: '{}',
      status: 'Draft',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        productName: product.productName,
        productDescription: product.productDescription,
        productImage: product.productImage,
        currentInformation: product.currentInformation,
        status: product.status,
      });
    } else {
      form.reset({
        productName: '',
        productDescription: '',
        productImage: 'https://placehold.co/100x100.png',
        currentInformation: '{}',
        status: 'Draft',
      });
    }
    setAiSuggestion('');
  }, [product, isOpen, form]);

  const onSubmit = (values: ProductFormValues) => {
    startTransition(async () => {
      try {
        const saved = await saveProduct({ ...values, id: product?.id });
        toast({
          title: 'Success!',
          description: `Passport for "${saved.productName}" has been saved.`,
        });
        onSave(saved);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the passport.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleEnhanceWithAI = async () => {
    const { productName, productDescription, currentInformation } = form.getValues();
    if (!productName || !productDescription) {
      toast({
        title: "Missing Information",
        description: "Please provide a product name and description before enhancing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAiLoading(true);
    setAiSuggestion('');
    try {
        const suggestion = await runEnhancement({ productName, productDescription, currentInformation });
        setAiSuggestion(suggestion);
    } catch (error) {
        toast({
            title: "AI Enhancement Failed",
            description: "Could not get suggestion from AI. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsAiLoading(false);
    }
  };

  const applySuggestion = () => {
    form.setValue('currentInformation', aiSuggestion, { shouldValidate: true });
    setAiSuggestion('');
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {product ? 'Edit Product Passport' : 'Create Product Passport'}
          </SheetTitle>
          <SheetDescription>
            {product
              ? 'Update the details for this product passport.'
              : 'Fill in the details for the new product passport.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-6">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Eco-Friendly Smart Watch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="productImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="currentInformation"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Passport Information (JSON)</FormLabel>
                     <Button type="button" size="sm" variant="outline" onClick={handleEnhanceWithAI} disabled={isAiLoading}>
                        {isAiLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                        )}
                        Enhance with AI
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea placeholder='{ "key": "value" }' {...field} className="min-h-[150px] font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {aiSuggestion && (
                <div className="space-y-2">
                    <FormLabel>AI Suggestion</FormLabel>
                    <Textarea readOnly value={aiSuggestion} className="min-h-[150px] font-mono text-sm bg-muted" />
                    <Button type="button" onClick={applySuggestion}>Apply Suggestion</Button>
                </div>
            )}
          </form>
        </Form>
        <SheetFooter className="pt-4 pr-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit" disabled={isPending} onClick={form.handleSubmit(onSubmit)}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Passport
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
