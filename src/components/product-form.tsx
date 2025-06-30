
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import type { Product, User } from '@/types';
import { saveProduct, runSuggestImprovements } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

// This is a temporary schema for the form.
// It will be replaced in Task 12 with a more structured approach.
const productSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  productImage: z.any(),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  // This JSON blob is the field we are working to eliminate.
  currentInformation: z.string().refine(
    val => {
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Must be valid JSON' },
  ),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onSave: (product: Product) => void;
  user: User;
}

const defaultJsonInfo = JSON.stringify(
  {
    materials: [
      {
        name: 'Recycled Aluminum',
        percentage: 60,
        recycledContent: 100,
        origin: 'Germany',
      },
    ],
    manufacturing: {
      facility: 'CleanEnergy Factory',
      country: 'Germany',
      emissionsKgCo2e: 5.5,
    },
    certifications: [{ name: 'EcoCert', issuer: 'EcoCert Group' }],
    packaging: {
      type: 'Recycled Cardboard',
      recycledContent: 100,
      recyclable: true,
    },
  },
  null,
  2,
);

export default function ProductForm({
  isOpen,
  onOpenChange,
  product,
  onSave,
  user,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      productImage: undefined,
      category: 'Electronics',
      supplier: '',
      status: 'Draft',
      currentInformation: defaultJsonInfo,
    },
  });

  useEffect(() => {
    if (product) {
      // If editing, populate the form with the product's data.
      // We stringify the structured data back into the JSON blob for the form.
      const info = JSON.stringify(
        {
          materials: product.materials,
          manufacturing: product.manufacturing,
          certifications: product.certifications,
          packaging: product.packaging,
        },
        null,
        2,
      );

      form.reset({
        productName: product.productName,
        productDescription: product.productDescription,
        productImage: product.productImage,
        category: product.category,
        supplier: product.supplier,
        status: product.status,
        currentInformation: info,
      });
    } else {
      // If creating, reset to default values.
      form.reset({
        productName: '',
        productDescription: '',
        productImage: undefined,
        category: 'Electronics',
        supplier: '',
        status: 'Draft',
        currentInformation: defaultJsonInfo,
      });
    }
  }, [product, isOpen, form]);

  const onSubmit = (values: ProductFormValues) => {
    startTransition(async () => {
      try {
        // This is the bridge from the old form to the new data structure.
        // We parse the JSON blob and merge it with the other form fields.
        const structuredInfo = JSON.parse(values.currentInformation);
        const productData = {
          productName: values.productName,
          productDescription: values.productDescription,
          productImage:
            product?.productImage ?? 'https://placehold.co/100x100.png',
          category: values.category,
          supplier: values.supplier,
          status: values.status,
          materials: structuredInfo.materials || [],
          manufacturing: structuredInfo.manufacturing || {},
          certifications: structuredInfo.certifications || [],
          packaging: structuredInfo.packaging || {},
        };

        const saved = await saveProduct(productData, user.id, product?.id);

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

  const handleSuggestImprovements = async () => {
    const { productName, productDescription } = form.getValues();
    if (!productName || !productDescription) {
      toast({
        title: 'Missing Information',
        description:
          'Please provide a product name and description before getting suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await runSuggestImprovements({
        productName,
        productDescription,
      });
      console.log('AI Recommendations:', result.recommendations);
      toast({
        title: 'AI Suggestions Ready',
        description: 'Check the browser console for recommendations.',
      });
    } catch (error) {
      toast({
        title: 'AI Suggestion Failed',
        description: 'Could not get suggestion from AI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>
            {product ? 'Edit Product Passport' : 'Create Product Passport'}
          </SheetTitle>
          <SheetDescription>
            {product
              ? 'Update the details for this product passport.'
              : 'Fill in the details for the new product passport.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-6"
            >
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Eco-Friendly Smart Watch"
                        {...field}
                      />
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
                      <Textarea
                        placeholder="Describe the product..."
                        {...field}
                      />
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
                    <FormLabel>Product Image</FormLabel>
                    {product?.productImage && (
                      <div className="mb-2">
                        <Image
                          src={product.productImage}
                          alt="Current product image"
                          width={100}
                          height={100}
                          className="rounded-md object-cover"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Image handling will be improved in a future task.
                        </p>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled // Disabled until Task 12
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Electronics">
                            Electronics
                          </SelectItem>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Home Goods">Home Goods</SelectItem>
                          <SelectItem value="Automotive">Automotive</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. GreenTech Supplies"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSuggestImprovements}
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                        )}
                        Get Recommendations
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder='{ "key": "value" }'
                        {...field}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isPending || isAiLoading}>
                  {(isPending || isAiLoading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? 'Saving...' : 'Save Passport'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
