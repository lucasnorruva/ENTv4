// src/components/product-detail-view.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Wrench,
  AlertTriangle,
} from 'lucide-react';

import type {
  Product,
  User,
  CompliancePath,
  AuditLog,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import DppQrCodeWidget from './dpp-qr-code-widget';
import DppCompletenessWidget from './dpp-completeness-widget';
import { AuditLogTimeline } from './audit-log-timeline';
import AiSuggestionsWidget from './ai-suggestions-widget';
import DocGenerationWidget from './doc-generation-widget';
import ComplianceAnalysisWidget from './compliance-analysis-widget';
import DataQualityWidget from './data-quality-widget';
import { generateAndSaveProductImage } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';
import AddServiceRecordDialog from './add-service-record-dialog';
import OverviewTab from './product-detail-tabs/overview-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';
import ComplianceTab from './product-detail-tabs/compliance-tab';
import LifecycleTab from './product-detail-tabs/lifecycle-tab';


export default function ProductDetailView({
  product: productProp,
  user,
  compliancePath,
  auditLogs,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
  auditLogs: AuditLog[];
}) {
  const [product, setProduct] = useState(productProp);
  const [isGeneratingImage, startImageGenerationTransition] = useTransition();
  const [contextImagePreview, setContextImagePreview] = useState<string | null>(
    null,
  );
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setProduct(productProp);
    setContextImagePreview(null);
  }, [productProp]);

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
          title: 'Image Generated',
          description: 'The new product image has been generated and saved.',
        });
        setContextImagePreview(null);
        // Clear file input
        const input = document.getElementById('context-image') as HTMLInputElement;
        if(input) input.value = '';
        router.refresh(); // Refresh server components to ensure consistency
      } catch (error: any) {
        toast({
          title: 'Image Generation Failed',
          description: error.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const canRunComplianceCheck = can(user, 'product:run_compliance');
  const canValidateData = can(user, 'product:validate_data', product);
  const canAddServiceRecord = can(user, 'product:add_service_record');
  const canGenerateDoc = can(user, 'product:edit', product);

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
    <>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
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
              <span>
                Last updated: {format(new Date(product.lastUpdated), 'PPP')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canAddServiceRecord && (
              <Button onClick={() => setIsServiceDialogOpen(true)}>
                <Wrench className="mr-2 h-4 w-4" /> Add Service Record
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/products/${product.id}`} target="_blank">
                View Public Passport
              </Link>
            </Button>
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
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                <TabsTrigger value="log">Audit Log</TabsTrigger>
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

              <TabsContent value="compliance" className="mt-4">
                <ComplianceTab product={product} compliancePath={compliancePath} />
              </TabsContent>

              <TabsContent value="lifecycle" className="mt-4">
                <LifecycleTab product={product} />
              </TabsContent>

              <TabsContent value="log" className="mt-4">
                <AuditLogTimeline logs={auditLogs} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-6">
            <DppCompletenessWidget product={product} />
            <DppQrCodeWidget productId={product.id} />
            {canRunComplianceCheck && (
              <ComplianceAnalysisWidget product={product} user={user} />
            )}
            {canValidateData && (
              <DataQualityWidget product={product} user={user} />
            )}
            <AiSuggestionsWidget product={product} />
            {canGenerateDoc && (
              <DocGenerationWidget product={product} user={user} />
            )}
          </div>
        </div>
      </div>
      {canAddServiceRecord && (
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
      )}
    </>
  );
}