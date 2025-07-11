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
  Clock,
  QrCode,
  Rss,
  ExternalLink,
} from 'lucide-react';

import type { Product, User, CompliancePath, AuditLog, Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from '@/components/ui/badge';
import RelativeTime from './relative-time';

import DppQrCodeWidget from './dpp-qr-code-widget';
import SubmissionChecklist from './submission-checklist';
import { can } from '@/lib/permissions';
import AddServiceRecordDialog from './add-service-record-dialog';
import AiActionsWidget from './ai-actions-widget';
import { runSubmissionValidation } from '@/services/validation';
import { AuditLogTimeline } from './audit-log-timeline';
import ProductAIChatbot from './product-ai-chatbot';

// Import newly created tab components
import OverviewTab from './product-detail-tabs/overview-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';
import LifecycleTab from './product-detail-tabs/lifecycle-tab';
import ComplianceTab from './product-detail-tabs/compliance-tab';
import HistoryTab from './product-detail-tabs/history-tab';
import SupplyChainTab from './product-detail-tabs/supply-chain-tab';
import ThreeDViewerTab from './product-detail-tabs/3d-viewer-tab';
import CustomsInspectionForm from './customs-inspection-form';
import ElectronicsTab from './product-detail-tabs/electronics-tab';
import TextileTab from './product-detail-tabs/textile-tab';
import FoodSafetyTab from './product-detail-tabs/food-safety-tab';
import ConstructionTab from './product-detail-tabs/construction-tab';
import DataCompositionTab from './product-detail-tabs/data-composition-tab';
import DigitalCredentialsTab from './product-detail-tabs/digital-credentials-tab';
import CircularityTab from './product-detail-tabs/circularity-tab';
import { getStatusBadgeVariant, getStatusBadgeClasses } from '@/lib/dpp-display-utils';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


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
  const isAiEnabled = company?.settings?.aiEnabled ?? false;

  const roleSlug =
    user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

  const handleUpdateAndRefresh = useCallback((updatedProduct: Product) => {
    setProduct(updatedProduct);
    router.refresh();
  }, [router]);

  const showElectronicsTab = product.category === 'Electronics' && product.electronicsAnalysis;
  const showTextileTab = product.category === 'Fashion' && product.textileAnalysis;
  const showConstructionTab = product.category === 'Construction' && product.constructionAnalysis;
  const showFoodTab = product.category === 'Food & Beverage' && product.foodSafetyAnalysis;

  return (
    <>
      <div className="space-y-6">
        <header className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Button asChild variant="outline" size="sm" className="mb-2">
                  <Link href={`/dashboard/${roleSlug}/products`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                  {product.productName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant={product.status === 'Published' ? 'default' : 'secondary'}>{product.status}</Badge>
                    <Badge variant={getStatusBadgeVariant(product.verificationStatus)} className={cn('capitalize', getStatusBadgeClasses(product.verificationStatus))}>{product.verificationStatus || 'Not Submitted'}</Badge>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> Last updated <RelativeTime date={product.lastUpdated} /></span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                 {product.status === 'Published' && (
                  <Button asChild variant="secondary">
                    <Link href={`/products/${product.id}`} target="_blank">
                      View Public Passport <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
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
              <div className="w-full overflow-x-auto">
                <TabsList className="w-max">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="data">Data &amp; Composition</TabsTrigger>
                  {showElectronicsTab && <TabsTrigger value="electronics">Electronics</TabsTrigger>}
                  {showTextileTab && <TabsTrigger value="textile">Textile</TabsTrigger>}
                  {showFoodTab && <TabsTrigger value="food">Food &amp; Beverage</TabsTrigger>}
                  {showConstructionTab && <TabsTrigger value="construction">Construction</TabsTrigger>}
                  <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                  <TabsTrigger value="circularity">Circularity</TabsTrigger>
                  <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  <TabsTrigger value="credentials">Digital Credentials</TabsTrigger>
                  <TabsTrigger value="supply_chain">Supply Chain</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="overview" className="mt-4">
                <OverviewTab
                  product={product}
                  customFields={company?.settings?.customFields}
                />
              </TabsContent>
               <TabsContent value="data" className="mt-4">
                  <DataCompositionTab product={product} />
              </TabsContent>
               {showElectronicsTab && (
                <TabsContent value="electronics" className="mt-4">
                  <ElectronicsTab product={product} />
                </TabsContent>
              )}
              {showTextileTab && (
                <TabsContent value="textile" className="mt-4">
                  <TextileTab product={product} />
                </TabsContent>
              )}
               {showFoodTab && (
                <TabsContent value="food" className="mt-4">
                  <FoodSafetyTab product={product} />
                </TabsContent>
              )}
              {showConstructionTab && (
                <TabsContent value="construction" className="mt-4">
                  <ConstructionTab product={product} />
                </TabsContent>
              )}
              <TabsContent value="lifecycle" className="mt-4">
                <LifecycleTab product={product} />
              </TabsContent>
              <TabsContent value="circularity" className="mt-4">
                <CircularityTab product={product} />
              </TabsContent>
               <TabsContent value="sustainability" className="mt-4">
                <SustainabilityTab product={product} />
              </TabsContent>
              <TabsContent value="compliance" className="mt-4">
                <ComplianceTab product={product} compliancePath={compliancePath}/>
              </TabsContent>
              <TabsContent value="credentials" className="mt-4">
                <DigitalCredentialsTab product={product} user={user} onUpdate={handleUpdateAndRefresh} />
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
            <Card>
                <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ai-chatbot" className="border-none">
                    <AccordionTrigger className="px-6 hover:no-underline">
                    <h3 className="text-lg font-semibold">Ask AI</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                    <ProductAIChatbot productId={product.id} />
                    </AccordionContent>
                </AccordionItem>
                </Accordion>
            </Card>

            {product.submissionChecklist && (
              <SubmissionChecklist checklist={product.submissionChecklist} />
            )}
            <Card>
              <CardHeader>
                <CardTitle>Digital Link</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="qr">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="qr"><QrCode className="mr-2 h-4 w-4"/>QR Code</TabsTrigger>
                        <TabsTrigger value="nfc"><Rss className="mr-2 h-4 w-4"/>NFC Chip</TabsTrigger>
                    </TabsList>
                    <TabsContent value="qr" className="mt-4">
                        <DppQrCodeWidget productId={product.id} />
                    </TabsContent>
                    <TabsContent value="nfc" className="mt-4">
                       <CardContent>
                          {product.nfc ? (
                            <div className="space-y-2 text-sm">
                              <p><strong>UID:</strong> <span className="font-mono">{product.nfc.uid}</span></p>
                              <p><strong>Technology:</strong> {product.nfc.technology}</p>
                              <p><strong>Write Protected:</strong> {product.nfc.writeProtected ? 'Yes' : 'No'}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No NFC chip data provided.</p>
                          )}
                        </CardContent>
                    </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

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
