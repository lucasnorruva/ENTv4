// src/components/product-form.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  Product,
  User,
  CompliancePath,
  CustomFieldDefinition,
} from '@/types';
import {
  saveProduct,
  generateProductDescription,
  generateAndSaveProductImage,
  getFriendlyError,
} from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { getCompanyById } from '@/lib/auth';

import GeneralTab from './product-form-tabs/general-tab';
import DataTab from './product-form-tabs/data-tab';
import LifecycleTab from './product-form-tabs/lifecycle-tab';
import ComplianceTab from './product-form-tabs/compliance-tab';
import CustomDataTab from './product-form-tabs/custom-data-tab';
import TextileTab from './product-form-tabs/textile-tab';

interface ProductFormProps {
  initialData?: Partial<Product>;
  user: User;
  compliancePaths: CompliancePath[];
  roleSlug: string;
}

export default function ProductForm({
  initialData,
  user,
  compliancePaths,
  roleSlug,
}: ProductFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const [isGeneratingDescription, startDescriptionGeneration] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImageFile, setContextImageFile] = useState<File | null>(null);

  const [manualFile, setManualFile] = useState<File | null>(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [manualUploadProgress, setManualUploadProgress] = useState(0);

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelUploadProgress, setModelUploadProgress] = useState(0);

  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isAiEnabled, setIsAiEnabled] = useState(false);

  const isEditMode = !!initialData?.id;

  const defaultNewValues: ProductFormValues = {
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
    compliance: {
      rohs: { compliant: false },
      reach: { svhcDeclared: false },
      weee: { registered: false },
      eudr: { compliant: false },
      ce: { marked: false },
      prop65: { warningRequired: false },
      foodContact: { safe: false },
      epr: { schemeId: '', producerRegistrationNumber: '', wasteCategory: '' },
      battery: { compliant: false },
      pfas: { declared: false },
      conflictMinerals: { compliant: false },
      espr: { compliant: false },
    },
    greenClaims: [],
    manualUrl: '',
    manualFileName: '',
    manualFileSize: 0,
    model3dUrl: '',
    model3dFileName: '',
    declarationOfConformity: '',
    compliancePathId: '',
    customData: {},
    textile: { fiberComposition: [] },
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...defaultNewValues,
      ...initialData,
      // Ensure nested objects are not undefined
      compliance: {
        ...defaultNewValues.compliance,
        ...initialData?.compliance,
      },
      greenClaims: initialData?.greenClaims || [],
    },
  });

  const category = form.watch('category');

  useEffect(() => {
    async function fetchCompanySettings() {
      const company = await getCompanyById(user.companyId);
      if (company?.settings?.customFields) {
        setCustomFields(company.settings.customFields);
      }
      setIsAiEnabled(company?.settings?.aiEnabled ?? false);
    }
    fetchCompanySettings();
  }, [user.companyId]);

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
  
  const {
    fields: greenClaimFields,
    append: appendGreenClaim,
    remove: removeGreenClaim,
  } = useFieldArray({ control: form.control, name: 'greenClaims' });

  const {
    fields: fiberFields,
    append: appendFiber,
    remove: removeFiber,
  } = useFieldArray({
    control: form.control,
    name: 'textile.fiberComposition',
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

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      setModelFile(file);
    } else if (file) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a .glb or .gltf file.',
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
    if (!initialData?.id) {
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
          initialData.id!,
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

  const onSubmit = (values: ProductFormValues) => {
    startSavingTransition(async () => {
      let imageUrl = initialData?.productImage;
      let manualUrl = initialData?.manualUrl;
      let manualFileName = initialData?.manualFileName;
      let manualFileSize = initialData?.manualFileSize;
      let model3dUrl = initialData?.model3dUrl;
      let model3dFileName = initialData?.model3dFileName;

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
          toast({ title: 'Manual Upload Failed', variant: 'destructive' });
          return;
        }
      }

      if (modelFile) {
        setIsUploadingModel(true);
        setModelUploadProgress(0);
        const storageRef = ref(
          storage,
          `models/${user.id}/${Date.now()}-${modelFile.name}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, modelFile);

        try {
          model3dUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              snapshot => {
                const progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setModelUploadProgress(progress);
              },
              error => {
                setIsUploadingModel(false);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref,
                );
                setIsUploadingModel(false);
                resolve(downloadURL);
              },
            );
          });
          model3dFileName = modelFile.name;
        } catch (error) {
          toast({ title: '3D Model Upload Failed', variant: 'destructive' });
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
          model3dUrl,
          model3dFileName,
        };
        const saved = await saveProduct(
          productData,
          user.id,
          initialData?.id,
        );
        toast({
          title: 'Success!',
          description: `Passport for "${saved.productName}" has been saved.`,
        });
        router.push(`/dashboard/${roleSlug}/products/${saved.id}`);
        router.refresh(); // Refresh server-side props for the target page
      } catch (error: any) {
        const friendlyError = await getFriendlyError(
          error,
          'saving the product passport',
          user,
        );
        toast({
          title: friendlyError.title,
          description: friendlyError.description,
          variant: 'destructive',
        });
      }
    });
  };

  const canEdit = isEditMode
    ? can(user, 'product:edit', initialData)
    : can(user, 'product:create');

  if (!canEdit) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">
          You do not have permission to perform this action.
        </p>
      </div>
    );
  }

  const hasCustomFields = customFields.length > 0;
  const showTextileTab = category === 'Fashion';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {isEditMode && initialData.id && (
                <Button asChild variant="outline" size="sm" className="mb-4">
                  <Link
                    href={`/dashboard/${roleSlug}/products/${initialData.id}`}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Product
                  </Link>
                </Button>
              )}
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditMode
                  ? `Edit: ${initialData.productName}`
                  : 'Create New Product Passport'}
              </h1>
            </div>
            <Button
              type="submit"
              disabled={
                isSaving ||
                isUploading ||
                isGeneratingImage ||
                isUploadingManual ||
                isUploadingModel
              }
            >
              {isSaving ||
              isUploading ||
              isGeneratingImage ||
              isUploadingManual ||
              isUploadingModel ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isUploading
                ? 'Uploading Image...'
                : isUploadingManual
                ? 'Uploading Manual...'
                : isUploadingModel
                ? 'Uploading Model...'
                : isGeneratingImage
                ? 'Generating...'
                : isSaving
                ? 'Saving...'
                : 'Save Changes'}
            </Button>
          </header>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full h-auto flex-wrap justify-start">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              {showTextileTab && (
                <TabsTrigger value="textile">Textile</TabsTrigger>
              )}
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              {hasCustomFields && (
                <TabsTrigger value="custom">Custom Data</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="general">
              <GeneralTab
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
                isAiEnabled={isAiEnabled}
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
                isAiEnabled={isAiEnabled}
              />
            </TabsContent>
            {showTextileTab && (
              <TabsContent value="textile">
                <TextileTab
                  form={form}
                  fiberFields={fiberFields}
                  appendFiber={appendFiber}
                  removeFiber={removeFiber}
                  user={user}
                  productId={initialData?.id}
                  isAiEnabled={isAiEnabled}
                />
              </TabsContent>
            )}
            <TabsContent value="lifecycle">
              <LifecycleTab
                form={form}
                handleManualChange={handleManualChange}
                isUploadingManual={isUploadingManual}
                manualUploadProgress={manualUploadProgress}
                handleModelChange={handleModelChange}
                isUploadingModel={isUploadingModel}
                modelUploadProgress={modelUploadProgress}
                isSaving={isSaving}
              />
            </TabsContent>
            <TabsContent value="compliance">
              <ComplianceTab
                form={form}
                compliancePaths={compliancePaths}
                greenClaimFields={greenClaimFields}
                appendGreenClaim={appendGreenClaim}
                removeGreenClaim={removeGreenClaim}
              />
            </TabsContent>
            {hasCustomFields && (
              <TabsContent value="custom">
                <CustomDataTab form={form} customFields={customFields} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </form>
    </Form>
  );
}
