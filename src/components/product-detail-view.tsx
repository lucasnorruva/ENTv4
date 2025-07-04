// src/components/product-detail-view.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Wrench, AlertTriangle, ArrowLeft } from 'lucide-react';

import type { Product, User, CompliancePath, AuditLog } from '@/types';
import { Badge } from '@/components/ui/badge';
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
import PublicPassportView from './public-passport-view';

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
  const router = useRouter();

  useEffect(() => {
    setProduct(productProp);
  }, [productProp]);

  const canEditProduct = can(user, 'product:edit', product);
  const canRunComplianceCheck = can(user, 'product:run_compliance');
  const canValidateData = can(user, 'product:validate_data', product);
  const canAddServiceRecord = can(user, 'product:add_service_record');
  const canGenerateDoc = can(user, 'product:edit', product);

  const roleSlug = user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'supplier';

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
              <Link href={`/dashboard/${roleSlug}/products/edit/${product.id}`}>
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
          <PublicPassportView
            product={product}
            compliancePath={compliancePath}
          />
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
