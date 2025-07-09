// src/components/product-detail-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  AlertTriangle,
  ArrowLeft,
  Landmark,
} from 'lucide-react';
import { format } from 'date-fns';

import type { Product, User, CompliancePath, AuditLog, Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import DppQrCodeWidget from './dpp-qr-code-widget';
import SubmissionChecklist from './submission-checklist';
import { can } from '@/lib/permissions';
import AddServiceRecordDialog from './add-service-record-dialog';
import AiActionsWidget from './ai-actions-widget';
import { runSubmissionValidation } from '@/services/validation';
import { AuditLogTimeline } from './audit-log-timeline';
import PredictiveAnalyticsWidget from './predictive-analytics-widget';

// Import newly created tab components
import OverviewTab from './product-detail-tabs/overview-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';
import LifecycleTab from './product-detail-tabs/lifecycle-tab';
import ComplianceTab from './product-detail-tabs/compliance-tab';
import HistoryTab from './product-detail-tabs/history-tab';
import SupplyChainTab from './product-detail-tabs/supply-chain-tab';
import ThreeDViewerTab from './product-detail-tabs/3d-viewer-tab';
import CustomsInspectionForm from './customs-inspection-form';
import HsCodeWidget from './hs-code-widget';

export default function ProductDetailView({
  product: productProp,
  user,
  compliancePath,
  auditLogs,
  userMap,
  company,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
  auditLogs: AuditLog[];
  userMap: Map<string, string>;
  company?: Company;
}) {
  const [product, setProduct] = useState(productProp);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCustomsFormOpen, setIsCustomsFormOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function validate() {
      const checklist = await runSubmissionValidation(productProp);
      setProduct(p => ({ ...p, submissionChecklist: checklist }));
    }
    validate();
  }, [productProp]);

  const canEditProduct = can(user, 'product:edit', product);
  const canRunComplianceCheck = can(user, 'product:run_compliance');
  const canValidateData = can(user, 'product:validate_data', product);
  const canAddServiceRecord = can(user, 'product:add_service_record');
  const canGenerateDoc = can(user, 'product:edit', product);
  const canLogInspection = can(user, 'product:customs_inspect');
  const canExportData = can(user, 'product:export_data', product);
  const canRunPrediction = can(user, 'product:run_prediction', product);
  const isAiEnabled = company?.settings?.aiEnabled ?? false;

  const roleSlug =
    user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

  const handleUpdateAndRefresh = useCallback((updatedProduct: Product) => {
    setProduct(updatedProduct);
    router.refresh();
  }, [router]);

  return (
    <>
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
          <div className="flex flex-wrap items-center gap-2">
            {canEditProduct && (
              <Button asChild>
                <Link
                  href={`/dashboard/${roleSlug}/products/${product.id}/edit`}
                >
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
            {canLogInspection && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomsFormOpen(true)}
              >
                <Landmark className="mr-2 h-4 w-4" /> Log Inspection
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
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="supply_chain">Supply Chain</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <OverviewTab
                  product={product}
                  customFields={company?.settings?.customFields}
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
              <TabsContent value="history" className="mt-4">
                <HistoryTab product={product} />
              </TabsContent>
              <TabsContent value="supply_chain" className="mt-4">
                <SupplyChainTab product={product} />
              </TabsContent>
            </Tabs>
            <ThreeDViewerTab product={product} />
            <AuditLogTimeline logs={auditLogs} userMap={userMap} />
          </div>
          <div className="space-y-6">
            {product.submissionChecklist && (
              <SubmissionChecklist checklist={product.submissionChecklist} />
            )}
            <DppQrCodeWidget productId={product.id} />
            <HsCodeWidget 
              product={product} 
              user={user} 
              onUpdate={handleUpdateAndRefresh} 
              isAiEnabled={isAiEnabled} 
            />
            {canRunPrediction && isAiEnabled && (
              <PredictiveAnalyticsWidget
                product={product}
                user={user}
                onPredictionComplete={handleUpdateAndRefresh}
              />
            )}
            <AiActionsWidget
              product={product}
              user={user}
              canRunComplianceCheck={canRunComplianceCheck}
              canValidateData={canValidateData}
              canGenerateDoc={canGenerateDoc}
              canExportData={canExportData}
              isAiEnabled={isAiEnabled}
            />
          </div>
        </div>
      </div>
      <AddServiceRecordDialog
        isOpen={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        product={product}
        user={user}
        onSave={handleUpdateAndRefresh}
      />
      <CustomsInspectionForm
        isOpen={isCustomsFormOpen}
        onOpenChange={setIsCustomsFormOpen}
        product={product}
        user={user}
        onSave={handleUpdateAndRefresh}
      />
    </>
  );
}
