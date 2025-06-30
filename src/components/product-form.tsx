
'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
  FormDescription,
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { Product, User } from '@/types';
import { saveProduct } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { compliancePaths } from '@/lib/compliance-data';

// Updated schema to match the new structured Product type
const productSchema = z.object({
  productName: z.string().min(3, 'Product name is required'),
  productDescription: z.string().min(10, 'Product description is required'),
  productImage: z.any(),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  status: z.enum(['Published', 'Draft', 'Archived']),
  compliancePathId: z.string().optional(),
  materials: z.array(
    z.object({
      name: z.string().min(1, 'Material name is required'),
      percentage: z.coerce.number().optional(),
      recycledContent: z.coerce.number().optional(),
      origin: z.string().optional(),
    }),
  ),
  manufacturing: z.object({
    facility: z.string().min(1, 'Facility name is required'),
    country: z.string().min(1, 'Country is required'),
    emissionsKgCo2e: z.coerce.number().optional(),
  }),
  certifications: z.array(
    z.object({
      name: z.string().min(1, 'Certificate name is required'),
      issuer: z.string().min(1, 'Issuer is required'),
      validUntil: z.string().optional(),
    }),
  ),
  packaging: z.object({
    type: z.string().min(1, 'Packaging type is required'),
    recycledContent: z.coerce.number().optional(),
    recyclable: z.boolean(),
  }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onSave: (product: Product) => void;
  user: User;
}

export default function ProductForm({
  isOpen,
  onOpenChange,
  product,
  onSave,
  user,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          ...product,
          manufacturing: product.manufacturing || { facility: '', country: '' },
          packaging: product.packaging || { type: '', recyclable: false },
        }
      : {
          productName: '',
          productDescription: '',
          productImage: undefined,
          category: 'Electronics',
          supplier: '',
          status: 'Draft',
          materials: [],
          manufacturing: { facility: '', country: '' },
          certifications: [],
          packaging: { type: '', recyclable: false },
        },
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({
    control: form.control,
    name: 'certifications',
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(
        product
          ? {
              ...product,
              manufacturing: product.manufacturing || {
                facility: '',
                country: '',
              },
              packaging: product.packaging || { type: '', recyclable: false },
            }
          : {
              productName: '',
              productDescription: '',
              productImage: undefined,
              category: 'Electronics',
              supplier: '',
              status: 'Draft',
              materials: [],
              manufacturing: { facility: '', country: '' },
              certifications: [],
              packaging: { type: '', recyclable: false },
            },
      );
    }
  }, [product, isOpen, form]);

  const onSubmit = (values: ProductFormValues) => {
    startTransition(async () => {
      try {
        const productData = {
          ...values,
          productImage:
            product?.productImage ?? 'https://placehold.co/100x100.png',
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full flex flex-col p-0 sm:max-w-2xl">
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="space-y-6 p-6">
              {/* Basic Info */}
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
                        disabled // Disabled until image upload is implemented
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
                        defaultValue={field.value}
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

              <Separator />

              {/* Compliance Path */}
              <FormField
                control={form.control}
                name="compliancePathId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Path</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a compliance standard..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {compliancePaths.map(path => (
                          <SelectItem key={path.id} value={path.id}>
                            {path.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the primary regulatory standard this product must
                      adhere to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Manufacturing */}
              <h3 className="text-lg font-semibold">Manufacturing</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturing.facility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. CleanEnergy Factory"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturing.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Germany" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Materials */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Materials</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendMaterial({
                        name: '',
                        percentage: 0,
                        recycledContent: 0,
                        origin: '',
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Material
                  </Button>
                </div>
                <div className="space-y-4">
                  {materialFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-4 gap-2 items-start border p-4 rounded-md relative"
                    >
                      <FormItem className="col-span-4">
                        <FormLabel>Material Name</FormLabel>
                        <FormControl>
                          <Input
                            {...form.register(`materials.${index}.name`)}
                            placeholder="e.g. Recycled Aluminum"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <FormItem>
                        <FormLabel>Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...form.register(`materials.${index}.percentage`)}
                            placeholder="e.g. 60"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <FormItem>
                        <FormLabel>Recycled %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...form.register(
                              `materials.${index}.recycledContent`,
                            )}
                            placeholder="e.g. 100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input
                            {...form.register(`materials.${index}.origin`)}
                            placeholder="e.g. Germany"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Certifications */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Certifications</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendCert({ name: '', issuer: '' })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Certificate
                  </Button>
                </div>
                <div className="space-y-4">
                  {certFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-2 gap-2 border p-4 rounded-md relative"
                    >
                      <FormItem>
                        <FormLabel>Certificate Name</FormLabel>
                        <FormControl>
                          <Input
                            {...form.register(`certifications.${index}.name`)}
                            placeholder="e.g. EcoCert"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <FormItem>
                        <FormLabel>Issuer</FormLabel>
                        <FormControl>
                          <Input
                            {...form.register(`certifications.${index}.issuer`)}
                            placeholder="e.g. EcoCert Group"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeCert(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Packaging */}
              <h3 className="text-lg font-semibold">Packaging</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packaging.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Recycled Cardboard"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packaging.recycledContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recycled Content (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="packaging.recyclable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Recyclable</FormLabel>
                      <FormDescription>
                        Is the packaging material recyclable?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Footer with actions */}
            <div className="flex justify-end gap-2 p-6 mt-auto border-t bg-background sticky bottom-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isPending ? 'Saving...' : 'Save Passport'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
