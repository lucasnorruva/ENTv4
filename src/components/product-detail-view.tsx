// src/components/product-detail-view.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, AlertTriangle, ArrowLeft, Save, Loader2 } from 'lucide-react';

import type { Product, User, CompliancePath, AuditLog } from '@/types';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Form } from '@/components/ui/form';

import DppQrCodeWidget from './dpp-qr-code-widget';
import DppCompletenessWidget from './dpp-completeness-widget';
import { AuditLogTimeline } from './audit-log-timeline';
import { generateAndSaveProductImage, saveProduct } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';
import AddServiceRecordDialog from './add-service-record-dialog';
import AiActionsWidget from './ai-actions-widget';
import GeneralTab from './product-form-tabs/general-tab';
import DataTab from './product-form-tabs/data-tab';
import LifecycleTab from './product-form-tabs/lifecycle-tab';
import ComplianceTab from './product-form-tabs/compliance-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';

export default function ProductDetailView({
  product: productProp,
  user,
  compliancePath,
  auditLogs,
  userMap,
  compliancePaths,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
  auditLogs: AuditLog[];
  userMap: Map<string, string>;
  compliancePaths: CompliancePath[];
}) {
  const [product, setProduct] = useState(productProp);
  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImagePreview, setContextImagePreview] = useState<string | null>(
    null,
  );
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productProp,
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
    setProduct(productProp);
    form.reset({
      ...productProp,
      gtin: productProp.gtin ?? '',
      productImage: productProp.productImage ?? '',
      manualUrl: productProp.manualUrl ?? '',
      declarationOfConformity: productProp.declarationOfConformity ?? '',
      compliancePathId: productProp.compliancePathId ?? '',
      materials: productProp.materials || [],
      manufacturing: productProp.manufacturing || { facility: '', country: '' },
      certifications: productProp.certifications || [],
      packaging: productProp.packaging || { type: '', recyclable: false },
      lifecycle: productProp.lifecycle || {},
      battery: productProp.battery || {},
      compliance: productProp.compliance || {},
    });
  }, [productProp, form]);

  const onSubmit = (values: ProductFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveProduct(values, user.id, product.id);
        toast({ title: 'Success!', description: 'Product passport updated.' });
        setProduct(saved);
        router.refresh(); // Refresh server components to ensure data consistency
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to save passport.', variant: 'destructive' });
      }
    });
  };

  const handleContextImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setContextImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = () => {
    startImageGenerationTransition(async () => {
      try {
        const updatedProduct = await generateAndSaveProductImage(
          product.id,
          user.id,
          contextImagePreview ?? undefined,
        );
        setProduct(updatedProduct);
        form.setValue('productImage', updatedProduct.productImage);
        toast({
          title: 'Image Generated',
          description: 'The new product image has been generated and saved.',
        });
        setContextImagePreview(null);
        // Clear file input
        const input = document.getElementById(
          'context-image',
        ) as HTMLInputElement;
        if (input) input.value = '';
        router.refresh();
      } catch (error: any) {
        toast({
          title: 'Image Generation Failed',
          description: error.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const canEditProduct = can(user, 'product:edit', product);
  const canRunComplianceCheck = can(user, 'product:run_compliance');
  const canValidateData = can(user, 'product:validate_data', product);
  const canAddServiceRecord = can(user, 'product:add_service_record');
  const canGenerateDoc = can(user, 'product:edit', product);

  const roleSlug = user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'Published':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getVerificationVariant = (status?: Product['verificationStatus']) => {
    switch (status) {
      case 'Verified':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href={`/dashboard/${roleSlug}/products`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {product.productName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant={getStatusVariant(product.status)}>
                  {product.status}
                </Badge>
                <Badge
                  variant={getVerificationVariant(product.verificationStatus)}
                >
                  {product.verificationStatus || 'Not Submitted'}
                </Badge>
                <span>·</span>
                <span suppressHydrationWarning>
                  Last updated: {format(new Date(product.lastUpdated), 'PPP')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canAddServiceRecord && (
                <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(true)}>
                  <Wrench className="mr-2 h-4 w-4" /> Add Service
                </Button>
              )}
               {canEditProduct && (
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
                )}
            </div>
          </header>

          {product.dataQualityWarnings &&
            product.dataQualityWarnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Quality Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 text-xs">
                    {product.dataQualityWarnings.map((warning, index) => (
                      <li key={index}>
                        <strong>{warning.field}:</strong> {warning.warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">General</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                    <TabsTrigger value="log">Audit Log</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <GeneralTab form={form} isUploading={false} isSaving={isSaving} imagePreview={product.productImage} handleImageChange={() => {}} uploadProgress={0} handleGenerateDescription={() => {}} isGeneratingDescription={false} />
                </TabsContent>
                <TabsContent value="data">
                    <DataTab form={form} materialFields={materialFields} appendMaterial={appendMaterial} removeMaterial={removeMaterial} certFields={certFields} appendCert={appendCert} removeCert={removeCert} />
                </TabsContent>
                <TabsContent value="lifecycle">
                    <LifecycleTab form={form} />
                </TabsContent>
                <TabsContent value="compliance">
                    <ComplianceTab form={form} compliancePaths={compliancePaths} />
                </TabsContent>
                <TabsContent value="sustainability" className="mt-4">
                  <SustainabilityTab product={product} />
                </TabsContent>
                <TabsContent value="log" className="mt-4">
                  <AuditLogTimeline logs={auditLogs} userMap={userMap} />
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-6">
              <DppCompletenessWidget product={product} />
              <DppQrCodeWidget productId={product.id} />
              <AiActionsWidget
                product={product}
                user={user}
                canRunComplianceCheck={canRunComplianceCheck}
                canValidateData={canValidateData}
                canGenerateDoc={canGenerateDoc}
              />
            </div>
          </div>
        </div>
        <AddServiceRecordDialog
          isOpen={isServiceDialogOpen}
          onOpenChange={setIsServiceDialogOpen}
          product={product}
          user={user}
          onSave={updatedProduct => {
            setProduct(updatedProduct);
            router.refresh();
          }}
        />
      </form>
    </Form>
  );
}
