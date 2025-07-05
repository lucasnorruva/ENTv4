// src/components/product-form-body.tsx
'use client';

import type { UseFormReturn, UseFieldArrayReturn, FieldArrayWithId } from 'react-hook-form';
import type { ProductFormValues } from '@/lib/schemas';
import type { CompliancePath } from '@/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralTab from './product-form-tabs/general-tab';
import DataTab from './product-form-tabs/data-tab';
import LifecycleTab from './product-form-tabs/lifecycle-tab';
import ComplianceTab from './product-form-tabs/compliance-tab';

interface ProductFormBodyProps {
  form: UseFormReturn<ProductFormValues>;
  isUploading: boolean;
  isSaving: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
  handleGenerateDescription: () => void;
  isGeneratingDescription: boolean;
  isGeneratingImage: boolean;
  handleContextImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateImage: () => void;
  materialFields: FieldArrayWithId<ProductFormValues, 'materials', 'id'>[];
  appendMaterial: UseFieldArrayReturn<ProductFormValues, 'materials'>['append'];
  removeMaterial: UseFieldArrayReturn<ProductFormValues, 'materials'>['remove'];
  certFields: FieldArrayWithId<ProductFormValues, 'certifications', 'id'>[];
  appendCert: UseFieldArrayReturn<ProductFormValues, 'certifications'>['append'];
  removeCert: UseFieldArrayReturn<ProductFormValues, 'certifications'>['remove'];
  handleManualChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingManual: boolean;
  manualUploadProgress: number;
  compliancePaths: CompliancePath[];
}

export default function ProductFormBody({
  form,
  isUploading,
  isSaving,
  imagePreview,
  handleImageChange,
  uploadProgress,
  handleGenerateDescription,
  isGeneratingDescription,
  isGeneratingImage,
  handleContextImageChange,
  handleGenerateImage,
  materialFields,
  appendMaterial,
  removeMaterial,
  certFields,
  appendCert,
  removeCert,
  handleManualChange,
  isUploadingManual,
  manualUploadProgress,
  compliancePaths,
}: ProductFormBodyProps) {
  return (
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
          <LifecycleTab
            form={form}
            handleManualChange={handleManualChange}
            isUploadingManual={isUploadingManual}
            manualUploadProgress={manualUploadProgress}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTab
            form={form}
            compliancePaths={compliancePaths}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
