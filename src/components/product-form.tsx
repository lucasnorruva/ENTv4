
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { storage } from '@/lib/firebase';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product, User } from '@/types';
import { saveProduct, runSuggestImprovements } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { compliancePaths } from '@/lib/compliance-data';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';

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
  const [isSaving, startSavingTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [recommendations, setRecommendations] =
    useState<SuggestImprovementsOutput | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
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
          supplier: '', // Will be set in action
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset(
        product
          ? {
              ...product,
              productImage: product.productImage ?? '',
              manufacturing: product.manufacturing || {
                facility: '',
                country: '',
              },
              packaging: product.packaging || { type: '', recyclable: false },
            }
          : {
              productName: '',
              productDescription: '',
              productImage: '',
              category: 'Electronics',
              supplier: '', // Will be set in action
              status: 'Draft',
              materials: [],
              manufacturing: { facility: '', country: '' },
              certifications: [],
              packaging: { type: '', recyclable: false },
            },
      );
      setImageFile(null);
      setImagePreview(product?.productImage ?? null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [product, isOpen, form]);

  const onSubmit = (values: ProductFormValues) => {
    startSavingTransition(async () => {
      let imageUrl = product?.productImage;

      if (imageFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const storageRef = ref(
          storage,
          `products/${user.id}/${Date.now()}-${imageFile.name}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        try {
          imageUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              snapshot => {
                const progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              error => {
                setIsUploading(false);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref,
                );
                setIsUploading(false);
                resolve(downloadURL);
              },
            );
          });
        } catch (error) {
          toast({
            title: 'Image Upload Failed',
            description:
              'There was an error uploading your image. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      try {
        const productData = {
          ...values,
          productImage: imageUrl ?? 'https://placehold.co/100x100.png',
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

  const handleGetSuggestions = () => {
    const { productName, productDescription } = form.getValues();
    if (!productName || !productDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a product name and description first.',
        variant: 'destructive',
      });
      return;
    }

    startSuggestionTransition(async () => {
      try {
        const result = await runSuggestImprovements({
          productName,
          productDescription,
        });
        setRecommendations(result);
        setIsSuggestionsOpen(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to get AI suggestions.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
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
              <Tabs defaultValue="general" className="h-full flex flex-col">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="packaging">Packaging</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="general" className="p-6 space-y-6">
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
                      render={() => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          {imagePreview && (
                            <div className="mb-2">
                              <Image
                                src={imagePreview}
                                alt="Product image preview"
                                width={100}
                                height={100}
                                className="rounded-md object-cover"
                                data-ai-hint="product photo"
                              />
                            </div>
                          )}
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={isUploading || isSaving}
                            />
                          </FormControl>
                          {isUploading && (
                            <div className="flex items-center gap-2 mt-2">
                              <Progress
                                value={uploadProgress}
                                className="w-full h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(uploadProgress)}%
                              </span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              <SelectItem value="Home Goods">
                                Home Goods
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="data" className="p-6 space-y-6">
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
                                  {...form.register(
                                    `materials.${index}.percentage`,
                                  )}
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
                                  {...form.register(
                                    `materials.${index}.origin`,
                                  )}
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
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          Certifications
                        </h3>
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
                                  {...form.register(
                                    `certifications.${index}.name`,
                                  )}
                                  placeholder="e.g. EcoCert"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                            <FormItem>
                              <FormLabel>Issuer</FormLabel>
                              <FormControl>
                                <Input
                                  {...form.register(
                                    `certifications.${index}.issuer`,
                                  )}
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
                  </TabsContent>

                  <TabsContent value="packaging" className="p-6 space-y-6">
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
                              <Input
                                type="number"
                                placeholder="e.g. 100"
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
                  </TabsContent>

                  <TabsContent value="compliance" className="p-6 space-y-6">
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
                            Select the primary regulatory standard this product
                            must adhere to.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </div>
              </Tabs>
              {/* Footer with actions */}
              <div className="flex justify-end gap-2 p-6 mt-auto border-t bg-background sticky bottom-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetSuggestions}
                  disabled={isSuggesting || isSaving || isUploading}
                >
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  AI Suggestions
                </Button>
                <div className="flex-grow" />
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving || isUploading}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSaving || isUploading}>
                  {(isSaving || isUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading
                    ? 'Uploading...'
                    : isSaving
                      ? 'Saving...'
                      : 'Save Passport'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Recommendations</DialogTitle>
            <DialogDescription>
              Here are some suggestions to improve this product's passport and
              sustainability profile.
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto">
            {recommendations?.recommendations.map((rec, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <p className="font-semibold">
                  <strong>{rec.type}:</strong> {rec.text}
                </p>
              </div>
            ))}
            {!recommendations?.recommendations && (
              <p>No recommendations generated.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuggestionsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
