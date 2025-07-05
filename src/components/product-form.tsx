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
import type { Product, User, CompliancePath } from '@/types';
import {
  saveProduct,
  suggestImprovements,
  generateProductDescription,
  generateAndSaveProductImage,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { SuggestImprovementsOutput } from '@/types/ai-outputs';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import ProductFormBody from './product-form-body';

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
  const [isGeneratingDescription, startDescriptionGeneration] = useTransition();
  const [recommendations, setRecommendations] =
    useState<SuggestImprovementsOutput | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImageFile, setContextImageFile] = useState<File | null>(null);

  const [manualFile, setManualFile] = useState<File | null>(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [manualUploadProgress, setManualUploadProgress] = useState(0);

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
      form.setValue('productImage', URL.createObjectURL(file));
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setManualFile(file);
    } else if (file) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file for the manual.',
        variant: 'destructive',
      });
    }
  };

  const handleContextImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    setContextImageFile(file);
  };

  const handleGenerateImage = () => {
    if (!product) {
      toast({
        title: 'Save Required',
        description:
          'Please save the product first before generating an image.',
        variant: 'destructive',
      });
      return;
    }
    startImageGenerationTransition(async () => {
      let contextImageDataUri: string | undefined = undefined;
      if (contextImageFile) {
        contextImageDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(contextImageFile);
        });
      }

      try {
        const updatedProduct = await generateAndSaveProductImage(
          product.id,
          user.id,
          contextImageDataUri,
        );
        form.setValue('productImage', updatedProduct.productImage);
        toast({
          title: 'Image Generated!',
          description: 'A new AI-powered image has been generated and saved.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate product image.',
          variant: 'destructive',
        });
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      form.reset(
        product
          ? {
              ...product,
              gtin: product.gtin ?? '',
              productImage: product.productImage ?? '',
              manualUrl: product.manualUrl ?? '',
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
      setUploadProgress(0);
      setIsUploading(false);
      setManualFile(null);
      setManualUploadProgress(0);
      setIsUploadingManual(false);
    }
  }, [product, isOpen, form]);

  const onSubmit = (values: ProductFormValues) => {
    startSavingTransition(async () => {
      let imageUrl = product?.productImage;
      let manualUrl = product?.manualUrl;
      let manualFileName = product?.manualFileName;
      let manualFileSize = product?.manualFileSize;

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

      if (manualFile) {
        setIsUploadingManual(true);
        setManualUploadProgress(0);
        const storageRef = ref(
          storage,
          `manuals/${user.id}/${Date.now()}-${manualFile.name}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, manualFile);

        try {
          manualUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              snapshot => {
                const progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setManualUploadProgress(progress);
              },
              error => {
                setIsUploadingManual(false);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref,
                );
                setIsUploadingManual(false);
                resolve(downloadURL);
              },
            );
          });
          manualFileName = manualFile.name;
          manualFileSize = manualFile.size;
        } catch (error) {
          toast({
            title: 'Manual Upload Failed',
            description:
              'There was an error uploading your manual. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      try {
        const productData = {
          ...values,
          productImage: imageUrl ?? 'https://placehold.co/100x100.png',
          manualUrl,
          manualFileName,
          manualFileSize,
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

  const handleGenerateDescription = () => {
    const { productName, category, materials } = form.getValues();
    if (!productName || !category) {
      toast({
        title: 'Missing Information',
        description:
          'Please provide a Product Name and Category before generating a description.',
        variant: 'destructive',
      });
      return;
    }

    startDescriptionGeneration(async () => {
      try {
        const result = await generateProductDescription({
          productName,
          category,
          materials: materials || [],
        });
        form.setValue('productDescription', result.productDescription, {
          shouldValidate: true,
        });
        toast({
          title: 'Description Generated',
          description: 'The AI-powered description has been added.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate description.',
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
              <ProductFormBody
                form={form}
                isUploading={isUploading}
                isSaving={isSaving}
                imagePreview={form.watch('productImage')}
                handleImageChange={handleImageChange}
                uploadProgress={uploadProgress}
                handleGenerateDescription={handleGenerateDescription}
                isGeneratingDescription={isGeneratingDescription}
                isGeneratingImage={isGeneratingImage}
                handleContextImageChange={handleContextImageChange}
                handleGenerateImage={handleGenerateImage}
                materialFields={materialFields}
                appendMaterial={appendMaterial}
                removeMaterial={removeMaterial}
                certFields={certFields}
                appendCert={appendCert}
                removeCert={removeCert}
                handleManualChange={handleManualChange}
                isUploadingManual={isUploadingManual}
                manualUploadProgress={manualUploadProgress}
                compliancePaths={compliancePaths}
              />
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
                <Button type="submit" disabled={isSaving || isUploading || isUploadingManual || isGeneratingImage}>
                  {(isSaving || isUploading || isUploadingManual || isGeneratingImage) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading
                    ? 'Uploading Image...'
                    : isUploadingManual
                    ? 'Uploading Manual...'
                    : isGeneratingImage
                    ? 'Generating...'
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
