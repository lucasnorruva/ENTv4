// src/components/product-form.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
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
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product, User, CompliancePath } from '@/types';
import { saveProduct } from '@/lib/actions';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { useToast } from '@/hooks/use-toast';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';

// Import the new tab components
import GeneralTab from './product-form-tabs/general-tab';
import DataTab from './product-form-tabs/data-tab';
import LifecycleTab from './product-form-tabs/lifecycle-tab';
import ComplianceTab from './product-form-tabs/compliance-tab';

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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="general">
                    <GeneralTab
                      form={form}
                      isUploading={isUploading}
                      isSaving={isSaving}
                      imagePreview={imagePreview}
                      handleImageChange={handleImageChange}
                      uploadProgress={uploadProgress}
                    />
                  </TabsContent>

                  <TabsContent value="data">
                    <DataTab
                      form={form}
                      materialFields={materialFields}
                      appendMaterial={appendMaterial}
                      removeMaterial={removeMaterial}
                      certFields={certFields}
                      appendCert={appendCert}
                      removeCert={removeCert}
                    />
                  </TabsContent>

                  <TabsContent value="lifecycle">
                    <LifecycleTab form={form} />
                  </TabsContent>

                  <TabsContent value="compliance">
                    <ComplianceTab
                      form={form}
                      compliancePaths={compliancePaths}
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
