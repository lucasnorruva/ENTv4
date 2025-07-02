// src/components/product-form.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  BatteryCharging,
  Leaf,
} from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Product, User, CompliancePath } from '@/types';
import { saveProduct } from '@/lib/actions';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { useToast } from '@/hooks/use-toast';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onSave: (product: Product) => void;
  user: User;
  compliancePaths: CompliancePath[];
}

export default function ProductForm({
  isOpen,
  onOpenChange,
  product,
  onSave,
  user,
  compliancePaths,
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
          lifecycle: product.lifecycle || {},
          battery: product.battery || {},
          compliance: product.compliance || {},
        }
      : {
          gtin: '',
          productName: '',
          productDescription: '',
          productImage: undefined,
          category: 'Electronics',
          status: 'Draft',
          materials: [],
          manufacturing: { facility: '', country: '' },
          certifications: [],
          packaging: { type: '', recyclable: false },
          lifecycle: {},
          battery: {},
          compliance: {},
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
              gtin: product.gtin ?? '',
              productImage: product.productImage ?? '',
              manufacturing: product.manufacturing || {
                facility: '',
                country: '',
              },
              packaging: product.packaging || {
                type: '',
                recyclable: false,
              },
              lifecycle: product.lifecycle || {},
              battery: product.battery || {},
              compliance: product.compliance || {},
            }
          : {
              gtin: '',
              productName: '',
              productDescription: '',
              productImage: '',
              category: 'Electronics',
              status: 'Draft',
              materials: [],
              manufacturing: { facility: '', country: '' },
              certifications: [],
              packaging: { type: '', recyclable: false },
              lifecycle: {},
              battery: {},
              compliance: {},
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
        const result = await suggestImprovements({
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
        <SheetContent className="w-full flex flex-col p-0 sm:max-w-3xl">
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="packaging">Packaging</TabsTrigger>
                    <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
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
                      name="gtin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GTIN (Global Trade Item Number)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 09501101420014"
                              {...field}
                            />
                          </FormControl>
                           <FormDescription>
                            The unique GS1 barcode number for your product (8, 12, 13, or 14 digits).
                          </FormDescription>
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
                      name="conformityDocUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declaration of Conformity URL</FormLabel>
                           <FormControl>
                            <Input
                              placeholder="https://example.com/doc.pdf"
                              {...field}
                            />
                          </FormControl>
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

                  <TabsContent value="data" className="p-6">
                    <Accordion type="multiple" defaultValue={['manufacturing', 'materials']} className="w-full space-y-4">
                      <AccordionItem value="manufacturing" className="border p-4 rounded-lg">
                         <AccordionTrigger>
                            <h3 className="text-lg font-semibold">Manufacturing</h3>
                          </AccordionTrigger>
                         <AccordionContent className="pt-4 space-y-4">
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
                         </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="materials" className="border p-4 rounded-lg">
                        <AccordionTrigger>
                          <h3 className="text-lg font-semibold">Materials</h3>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                           <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-muted-foreground">List all materials in the product.</p>
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
                                          { valueAsNumber: true },
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
                                          { valueAsNumber: true },
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
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="certifications" className="border p-4 rounded-lg">
                         <AccordionTrigger>
                           <h3 className="text-lg font-semibold">Certifications</h3>
                         </AccordionTrigger>
                         <AccordionContent className="pt-4">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-muted-foreground">List relevant product or company certifications.</p>
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
                         </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="battery" className="border p-4 rounded-lg">
                        <AccordionTrigger>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BatteryCharging />
                            Battery Details (if applicable)
                          </h3>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <FormField
                            control={form.control}
                            name="battery.type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Battery Type</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Lithium-ion"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="battery.capacityMah"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Capacity (mAh)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="e.g., 3110"
                                      {...field}
                                      onChange={e => field.onChange(e.target.valueAsNumber)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="battery.voltage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voltage (V)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="e.g., 3.83"
                                      {...field}
                                      onChange={e => field.onChange(e.target.valueAsNumber)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="battery.isRemovable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Is Removable?</FormLabel>
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
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="packaging" className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold">Packaging</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="packaging.type"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
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
                        name="packaging.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (grams)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 50"
                                {...field}
                                onChange={e =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                              onChange={e =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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

                  <TabsContent value="lifecycle" className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold">
                      Lifecycle & Durability
                    </h3>
                     <FormField
                      control={form.control}
                      name="lifecycle.energyEfficiencyClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy Efficiency Class</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lifecycle.carbonFootprint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carbon Footprint (kg CO2-eq)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 15.5"
                              {...field}
                              onChange={e =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lifecycle.carbonFootprintMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footprint Method</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., ISO 14067"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The methodology used for carbon footprint
                            calculation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lifecycle.repairabilityScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repairability Score (1-10)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 7"
                                {...field}
                                onChange={e =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lifecycle.expectedLifespan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Lifespan (years)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 5"
                                {...field}
                                onChange={e =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="lifecycle.recyclingInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recycling Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide end-of-life instructions..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
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
                    <Separator />
                    <h3 className="text-lg font-semibold">Declarations</h3>
                     <Accordion type="multiple" defaultValue={['rohs']} className="w-full space-y-4">
                       <AccordionItem value="rohs" className="border p-4 rounded-lg">
                        <AccordionTrigger>RoHS</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                           <FormField
                            control={form.control}
                            name="compliance.rohsCompliant"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>RoHS Compliant</FormLabel>
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
                          <FormField
                            control={form.control}
                            name="compliance.rohsExemption"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RoHS Exemption</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 6(c)" {...field} />
                                </FormControl>
                                <FormDescription>
                                  If applicable, provide the RoHS exemption details.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                       </AccordionItem>
                       <AccordionItem value="reach" className="border p-4 rounded-lg">
                         <AccordionTrigger>REACH / SCIP</AccordionTrigger>
                         <AccordionContent className="pt-4 space-y-4">
                            <FormField
                              control={form.control}
                              name="compliance.reachSVHC"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>REACH SVHC Declared</FormLabel>
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
                            <FormField
                              control={form.control}
                              name="compliance.scipReference"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SCIP Reference</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The reference number from the SCIP database, if
                                    applicable.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                         </AccordionContent>
                       </AccordionItem>
                        <AccordionItem value="weee" className="border p-4 rounded-lg">
                         <AccordionTrigger>WEEE</AccordionTrigger>
                         <AccordionContent className="pt-4 space-y-4">
                           <FormField
                              control={form.control}
                              name="compliance.weeeRegistered"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>WEEE Registered</FormLabel>
                                    <FormDescription>
                                      Is the product registered with a national WEEE scheme?
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
                           <FormField
                              control={form.control}
                              name="compliance.weeeRegistrationNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>WEEE Registration Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., DE 12345678"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The producer registration number for the WEEE scheme.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                         </AccordionContent>
                       </AccordionItem>
                       <AccordionItem value="eudr" className="border p-4 rounded-lg">
                         <AccordionTrigger>
                           <h3 className="flex items-center gap-2 font-semibold">
                             <Leaf className="h-4 w-4" />
                             EUDR
                           </h3>
                         </AccordionTrigger>
                         <AccordionContent className="pt-4 space-y-4">
                           <FormField
                              control={form.control}
                              name="compliance.eudrCompliant"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>EUDR Compliant</FormLabel>
                                    <FormDescription>
                                      Product is compliant with EU Deforestation-Free Regulation.
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
                           <FormField
                              control={form.control}
                              name="compliance.eudrDiligenceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>EUDR Due Diligence ID</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., DDS-12345-ABC"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The reference ID for the due diligence statement.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                         </AccordionContent>
                       </AccordionItem>
                       <AccordionItem value="additional" className="border p-4 rounded-lg">
                         <AccordionTrigger>Additional Declarations</AccordionTrigger>
                         <AccordionContent className="pt-4 space-y-4">
                           <FormField
                              control={form.control}
                              name="compliance.ceMarked"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>CE Marked</FormLabel>
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
                            <FormField
                              control={form.control}
                              name="compliance.prop65WarningRequired"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Prop 65 Warning Required</FormLabel>
                                    <FormDescription>For products sold in California.</FormDescription>
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
                            <FormField
                              control={form.control}
                              name="compliance.foodContactSafe"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Food Contact Safe</FormLabel>
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
                            <FormField
                              control={form.control}
                              name="compliance.foodContactComplianceStandard"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Food Contact Standard</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., EU 10/2011"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                         </AccordionContent>
                       </AccordionItem>
                     </Accordion>
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
