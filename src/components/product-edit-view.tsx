// src/components/product-edit-view.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';

import type { Product, User, CompliancePath } from '@/types';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';

import {
  saveProduct,
  generateProductDescription,
  generateAndSaveProductImage,
} from '@/lib/actions';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';

import GeneralTab from '../app/dashboard/product-form-tabs/general-tab';
import DataTab from '../app/dashboard/product-form-tabs/data-tab';
import LifecycleTab from '../app/dashboard/product-form-tabs/lifecycle-tab';
import ComplianceTab from '../app/dashboard/product-form-tabs/compliance-tab';

export default function ProductEditView({
  product: initialProduct,
  user,
  compliancePaths,
}: {
  product: Product;
  user: User;
  compliancePaths: CompliancePath[];
}) {
  const [product, setProduct] = useState(initialProduct);
  const [isSaving, startSavingTransition] = useTransition();
  const [isGeneratingDescription, startDescriptionGeneration] = useTransition();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImageFile, setContextImageFile] = useState<File | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialProduct,
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control: form.control, name: 'materials' });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control: form.control, name: 'certifications' });

  useEffect(() => {
    setProduct(initialProduct);
    form.reset({
      ...initialProduct,
      gtin: initialProduct.gtin ?? '',
      productImage: initialProduct.productImage ?? '',
      manualUrl: initialProduct.manualUrl ?? '',
      declarationOfConformity: initialProduct.declarationOfConformity ?? '',
      compliancePathId: initialProduct.compliancePathId ?? '',
      materials: initialProduct.materials || [],
      manufacturing: initialProduct.manufacturing || {
        facility: '',
        country: '',
      },
      certifications: initialProduct.certifications || [],
      packaging: initialProduct.packaging || { type: '', recyclable: false },
      lifecycle: initialProduct.lifecycle || {},
      battery: initialProduct.battery || {},
      compliance: initialProduct.compliance || {},
    });
  }, [initialProduct, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      form.setValue('productImage', URL.createObjectURL(file));
    }
  };

  const handleContextImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    setContextImageFile(file);
  };
  
  const handleGenerateImage = () => {
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
        setProduct(updatedProduct);
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
        const saved = await saveProduct(
          { ...values, productImage: imageUrl },
          user.id,
          product.id,
        );
        toast({ title: 'Success!', description: 'Product passport updated.' });
        router.push(
          `/dashboard/${roleSlug}/products/${saved.id}`,
        );
        router.refresh();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save passport.',
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

  const canEditProduct = can(user, 'product:edit', product);
  const roleSlug = user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

  if (!canEditProduct) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">
          You do not have permission to edit this product.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href={`/dashboard/${roleSlug}/products/${product.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Product
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                Edit: {product.productName}
              </h1>
            </div>
            <Button type="submit" disabled={isSaving || isUploading || isGeneratingImage}>
              {isSaving || isUploading || isGeneratingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : isGeneratingImage ? 'Generating...' : isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </header>

          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralTab
                form={form}
                isUploading={isUploading}
                isSaving={isSaving}
                imagePreview={form.watch('productImage') || null}
                handleImageChange={handleImageChange}
                uploadProgress={uploadProgress}
                handleGenerateDescription={handleGenerateDescription}
                isGeneratingDescription={isGeneratingDescription}
                isGeneratingImage={isGeneratingImage}
                handleContextImageChange={handleContextImageChange}
                handleGenerateImage={handleGenerateImage}
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
              <ComplianceTab form={form} compliancePaths={compliancePaths} />
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </Form>
  );
}
