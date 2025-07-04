// src/components/product-detail-view.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wrench, AlertTriangle, ArrowLeft } from 'lucide-react';

import type { Product, User, CompliancePath, AuditLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import DppQrCodeWidget from './dpp-qr-code-widget';
import DppCompletenessWidget from './dpp-completeness-widget';
import { AuditLogTimeline } from './audit-log-timeline';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';
import AddServiceRecordDialog from './add-service-record-dialog';
import AiActionsWidget from './ai-actions-widget';
import { generateAndSaveProductImage } from '@/lib/actions';

// Import newly created tab components
import OverviewTab from './product-detail-tabs/overview-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';
import LifecycleTab from './product-detail-tabs/lifecycle-tab';
import ComplianceTab from './product-detail-tabs/compliance-tab';

export default function ProductDetailView({
  product: productProp,
  user,
  compliancePath,
  auditLogs,
  userMap,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
  auditLogs: AuditLog[];
  userMap: Map<string, string>;
  compliancePaths: CompliancePath[];
}) {
  const [product, setProduct] = useState(productProp);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImagePreview, setContextImagePreview] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setProduct(productProp);
  }, [productProp]);

  const canEditProduct = can(user, 'product:edit', product);
  const canRunComplianceCheck = can(user, 'product:run_compliance');
  const canValidateData = can(user, 'product:validate_data', product);
  const canAddServiceRecord = can(user, 'product:add_service_record');
  const canGenerateDoc = can(user, 'product:edit', product);

  const roleSlug =
    user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

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
        toast({
          title: 'Image Generated!',
          description: 'A new AI-powered image has been generated and saved.',
        });
        router.refresh();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate product image.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href={`/dashboard/${roleSlug}/products`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {canEditProduct && (
            <Button asChild>
              <Link href={`/dashboard/${roleSlug}/products/${product.id}/edit`}>
                Edit Passport
              </Link>
            </Button>
          )}
          {canAddServiceRecord && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsServiceDialogOpen(true)}
            >
              <Wrench className="mr-2 h-4 w-4" /> Add Service
            </Button>
          )}
        </div>
      </header>

      {product.dataQualityWarnings && product.dataQualityWarnings.length > 0 && (
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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                product={product}
                isGeneratingImage={isGeneratingImage}
                contextImagePreview={contextImagePreview}
                handleContextImageChange={handleContextImageChange}
                handleGenerateImage={handleGenerateImage}
              />
            </TabsContent>
            <TabsContent value="sustainability" className="mt-4">
              <SustainabilityTab product={product} />
            </TabsContent>
            <TabsContent value="lifecycle" className="mt-4">
              <LifecycleTab product={product} />
            </TabsContent>
            <TabsContent value="compliance" className="mt-4">
              <ComplianceTab
                product={product}
                compliancePath={compliancePath}
              />
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

      <AuditLogTimeline logs={auditLogs} userMap={userMap} />

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
    </div>
  );
}
