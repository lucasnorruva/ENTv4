
// src/components/public-passport-view.tsx
'use client';

import type { Product, CompliancePath, Company } from '@/types';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  Fingerprint,
  Quote,
  Globe,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import OverviewTab from './product-detail-tabs/overview-tab';
import SustainabilityTab from './product-detail-tabs/sustainability-tab';
import LifecycleTab from './product-detail-tabs/lifecycle-tab';
import ComplianceTab from './product-detail-tabs/compliance-tab';
import TextileTab from './product-detail-tabs/textile-tab';
import FoodSafetyTab from './product-detail-tabs/food-safety-tab';
import { getStatusBadgeVariant } from '@/lib/dpp-display-utils';
import { Button } from './ui/button';
import ConstructionTab from './product-detail-tabs/construction-tab';
import ElectronicsTab from './product-detail-tabs/electronics-tab';

export default function PublicPassportView({
  product,
  compliancePath,
  company,
}: {
  product: Product;
  compliancePath?: CompliancePath;
  company?: Company;
}) {
  const customsStatusVariant = getStatusBadgeVariant(product.customs?.status);

  const showElectronicsTab = product.category === 'Electronics';
  const showTextileTab = product.category === 'Fashion';
  const showConstructionTab = product.category === 'Construction';
  const showFoodTab = product.category === 'Food & Beverage';

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden shadow-none border-0 md:border md:shadow-sm bg-transparent md:bg-card">
      <CardHeader className="bg-muted/50 p-6 flex flex-col md:flex-row gap-6 items-center">
        <Image
          src={product.productImage}
          alt={product.productName}
          width={150}
          height={150}
          className="rounded-lg border object-cover aspect-square"
          data-ai-hint="product photo"
        />
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {product.category}
          </Badge>
          <CardTitle as="h1" className="text-3xl font-bold">
            {product.productName}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            {product.productDescription}
          </CardDescription>
          {product.qrLabelText && (
            <blockquote className="mt-4 border-l-2 pl-4 italic text-muted-foreground flex gap-2">
              <Quote className="h-4 w-4 shrink-0" />
              <span>{product.qrLabelText}</span>
            </blockquote>
          )}
          <div className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            Supplied by: <strong>{product.supplier}</strong>
            {company?.isTrustedIssuer && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Trusted Issuer
                </Badge>
            )}
          </div>
          {product.gtin && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              GTIN: <strong className="font-mono">{product.gtin}</strong>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 flex flex-col justify-center">
            <CardTitle as="h2" className="text-lg mb-2">
              Verification Status
            </CardTitle>
            <div className="flex items-center gap-3">
              {product.verificationStatus === 'Verified' ? (
                <ShieldCheck className="h-10 w-10 text-green-600" />
              ) : (
                <ShieldAlert className="h-10 w-10 text-amber-600" />
              )}
              <div>
                <Badge
                  variant={
                    product.verificationStatus === 'Verified'
                      ? 'default'
                      : product.verificationStatus === 'Failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-sm"
                >
                  {product.verificationStatus || 'Not Submitted'}
                </Badge>
                {product.lastVerificationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Checked:{' '}
                    {format(new Date(product.lastVerificationDate), 'PPP')}
                  </p>
                )}
              </div>
            </div>
            {product.verificationStatus === 'Verified' &&
              product.blockchainProof && (
                <Link
                  href={product.blockchainProof.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-3 flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" /> View On-Chain Proof
                </Link>
              )}
          </Card>
          <Card className="p-4 flex flex-col justify-center">
            <CardTitle as="h2" className="text-lg mb-2">
              Customs Status
            </CardTitle>
            {product.customs ? (
              <div className="flex items-center gap-3">
                <Globe className="h-10 w-10 text-primary" />
                <div>
                  <Badge
                    variant={customsStatusVariant}
                    className="text-sm"
                  >
                    {product.customs.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    At: {product.customs.location}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1"
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(product.customs.date), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No customs events recorded.
              </p>
            )}
            {product.transit && (
                <Button asChild variant="secondary" size="sm" className="w-full mt-4">
                  <Link href={`/dashboard/retailer/global-tracker?productId=${product.id}`}>
                    <Globe className="mr-2 h-4 w-4" /> Track Shipment
                  </Link>
                </Button>
            )}
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {showElectronicsTab && <TabsTrigger value="electronics">Electronics</TabsTrigger>}
            {showTextileTab && <TabsTrigger value="textile">Textile</TabsTrigger>}
            {showFoodTab && <TabsTrigger value="food">Food & Beverage</TabsTrigger>}
            {showConstructionTab && <TabsTrigger value="construction">Construction</TabsTrigger>}
            <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle & Circularity</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <OverviewTab product={product} />
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
          <TabsContent value="sustainability" className="mt-4">
            <SustainabilityTab product={product} />
          </TabsContent>
          <TabsContent value="lifecycle" className="mt-4">
            <LifecycleTab product={product} />
          </TabsContent>
          <TabsContent value="compliance" className="mt-4">
            <ComplianceTab product={product} compliancePath={compliancePath} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
