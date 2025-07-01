// src/components/product-detail-view.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  FilePenLine,
  Leaf,
  Link as LinkIcon,
  Package,
  Recycle,
  Scale,
  ShieldCheck,
  Tag,
  Wrench,
  Factory,
  Globe,
  FileText,
  AlertTriangle,
  Fingerprint,
  Quote,
  Thermometer,
  Lightbulb,
  Sparkles,
  Archive,
  FileQuestion,
  Users,
  Landmark,
} from 'lucide-react';

import type { Product, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import DppQrCodeWidget from './dpp-qr-code-widget';
import DppCompletenessWidget from './dpp-completeness-widget';

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <p className="text-muted-foreground">{value}</p>}
        {children}
      </div>
    </div>
  );
}

export default function ProductDetailView({
  product,
  user,
}: {
  product: Product;
  user: User;
}) {
  const { sustainability } = product;
  const lifecycle = sustainability?.lifecycleAnalysis;

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
            <span>Last updated: {format(new Date(product.lastUpdated), 'PPP')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.id}`} target="_blank">
              View Public Passport
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="log">Verification Log</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                       <Image
                        src={product.productImage}
                        alt={product.productName}
                        width={600}
                        height={400}
                        className="rounded-lg border object-cover aspect-[3/2]"
                        data-ai-hint="product photo"
                      />
                       <Button variant="outline" size="sm" className="w-full mt-2">
                         <Sparkles className="mr-2 h-4 w-4" />
                         Generate Image
                       </Button>
                    </div>
                    <div className="md:col-span-2 space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Description</p>
                        <p className="text-muted-foreground">{product.productDescription}</p>
                      </div>
                       <div>
                        <p className="font-medium">Category</p>
                        <p className="text-muted-foreground">{product.category}</p>
                      </div>
                      <div>
                        <p className="font-medium">Manufacturer</p>
                        <p className="text-muted-foreground">{product.supplier}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Other tab contents can be added here */}
            <TabsContent value="sustainability" className="mt-4">
               <Card>
                 <CardHeader><CardTitle>Sustainability</CardTitle></CardHeader>
                 <CardContent><p>Sustainability details coming soon.</p></CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="compliance" className="mt-4">
               <Card>
                 <CardHeader><CardTitle>Compliance</CardTitle></CardHeader>
                 <CardContent><p>Compliance details coming soon.</p></CardContent>
               </Card>
            </TabsContent>
             <TabsContent value="lifecycle" className="mt-4">
               <Card>
                 <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
                 <CardContent><p>Lifecycle details coming soon.</p></CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="log" className="mt-4">
               <Card>
                 <CardHeader><CardTitle>Verification Log</CardTitle></CardHeader>
                 <CardContent><p>Log details coming soon.</p></CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">
          <DppQrCodeWidget />
          <DppCompletenessWidget product={product} />
        </div>
      </div>
    </div>
  );
}
