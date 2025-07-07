// src/components/product-detail-tabs/3d-viewer-tab.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Dynamically import the 3D viewer to avoid SSR issues with WebGL
const Product3DViewer = dynamic(() => import('../product-3d-viewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface ThreeDViewerTabProps {
    product: Product;
}

export default function ThreeDViewerTab({ product }: ThreeDViewerTabProps) {
  if (!product.model3dUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Digital Twin</CardTitle>
          <CardDescription>
            Interactive 3D representation of the product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No 3D model has been uploaded for this product.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digital Twin</CardTitle>
        <CardDescription>
          Interact with the product's digital twin. Click hotspots for more info.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Product3DViewer modelUrl={product.model3dUrl} hotspots={product.modelHotspots} />
      </CardContent>
    </Card>
  );
}
