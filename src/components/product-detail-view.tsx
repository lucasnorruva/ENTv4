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
  Percent,
  MapPin,
} from 'lucide-react';

import type { Product, User, CompliancePath } from '@/types';
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
  compliancePath,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
}) {
  const { sustainability } = product;
  const esg = sustainability;
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
            <span>
              Last updated: {format(new Date(product.lastUpdated), 'PPP')}
            </span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Image
                      </Button>
                    </div>
                    <div className="md:col-span-2 space-y-3 text-sm">
                      <InfoRow
                        icon={Quote}
                        label="Description"
                        value={product.productDescription}
                      />
                      <InfoRow
                        icon={Tag}
                        label="Category"
                        value={product.category}
                      />
                      <InfoRow
                        icon={Landmark}
                        label="Manufacturer"
                        value={product.supplier}
                      />
                    </div>
                  </div>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full mt-4"
                  >
                    <AccordionItem value="materials">
                      <AccordionTrigger>
                        Materials & Manufacturing
                      </AccordionTrigger>
                      <AccordionContent>
                        <InfoRow icon={Factory} label="Manufacturing">
                          <p className="text-sm text-muted-foreground">
                            {product.manufacturing?.facility} in{' '}
                            {product.manufacturing?.country}
                          </p>
                        </InfoRow>
                        <InfoRow icon={Scale} label="Material Composition">
                          {product.materials.length > 0 ? (
                            <div className="space-y-3 mt-2">
                              {product.materials.map((mat, index) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium text-foreground">
                                    {mat.name}
                                  </p>
                                  <div className="flex gap-4 text-muted-foreground text-xs">
                                    {mat.percentage !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Percent className="h-3 w-3" />{' '}
                                        {mat.percentage}% of total
                                      </span>
                                    )}
                                    {mat.recycledContent !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Recycle className="h-3 w-3" />{' '}
                                        {mat.recycledContent}% recycled
                                      </span>
                                    )}
                                    {mat.origin && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Origin:{' '}
                                        {mat.origin}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">
                              No material data provided.
                            </p>
                          )}
                        </InfoRow>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sustainability" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sustainability & ESG Metrics</CardTitle>
                  <CardDescription>
                    AI-generated scores based on product data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {esg ? (
                    <div className="space-y-4">
                      <InfoRow icon={Leaf} label="Overall ESG Score">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-primary">
                            {esg.score} / 100
                          </span>
                          <Progress value={esg.score} className="w-full" />
                        </div>
                      </InfoRow>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Environmental
                          </p>
                          <p className="text-lg font-bold">
                            {esg.environmental}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Social
                          </p>
                          <p className="text-lg font-bold">{esg.social}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Governance
                          </p>
                          <p className="text-lg font-bold">{esg.governance}</p>
                        </div>
                      </div>
                      <InfoRow
                        icon={Quote}
                        label="AI Summary"
                        value={esg.summary}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Sustainability data has not been generated yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                  <CardDescription>
                    Verification against selected compliance paths and
                    regulations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sustainability?.gaps && sustainability.gaps.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Compliance Gaps Identified</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                          {sustainability.gaps.map((gap, index) => (
                            <li key={index}>
                              <strong>{gap.regulation}:</strong> {gap.issue}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {compliancePath ? (
                    <InfoRow icon={FileQuestion} label="Compliance Path">
                      <p className="font-semibold text-foreground">
                        {compliancePath.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {compliancePath.description}
                      </p>
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full mt-2"
                      >
                        <AccordionItem value="rules">
                          <AccordionTrigger className="text-xs">
                            View Path Rules (JSON)
                          </AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(compliancePath.rules, null, 2)}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </InfoRow>
                  ) : (
                    <InfoRow
                      icon={FileQuestion}
                      label="Compliance Path"
                      value={'None selected'}
                    />
                  )}
                  <InfoRow
                    icon={Globe}
                    label="AI Compliance Summary"
                    value={sustainability?.complianceSummary || 'Awaiting review.'}
                  />
                  <InfoRow icon={FileText} label="Certifications">
                    {product.certifications &&
                    product.certifications.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {product.certifications.map(
                          (cert: any, index: number) => (
                            <li key={index}>
                              {cert.name} (by {cert.issuer})
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No certifications listed.
                      </p>
                    )}
                  </InfoRow>
                  {product.blockchainProof && (
                    <InfoRow icon={Fingerprint} label="On-Chain Proof">
                      <Link
                        href={product.blockchainProof.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        View Transaction
                        <LinkIcon className="h-3 w-3" />
                      </Link>
                    </InfoRow>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lifecycle Analysis</CardTitle>
                  <CardDescription>
                    AI-generated analysis of the product's environmental impact
                    from cradle to grave.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lifecycle ? (
                    <>
                      <InfoRow
                        icon={Thermometer}
                        label="Estimated Carbon Footprint"
                        value={`${lifecycle.carbonFootprint.value} ${lifecycle.carbonFootprint.unit}`}
                      >
                        <p className="text-xs text-muted-foreground mt-1">
                          {lifecycle.carbonFootprint.summary}
                        </p>
                      </InfoRow>
                      <InfoRow
                        icon={Lightbulb}
                        label="Lifecycle Stages Impact"
                      >
                        <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                          <p>
                            <strong>Manufacturing:</strong>{' '}
                            {lifecycle.lifecycleStages.manufacturing}
                          </p>
                          <p>
                            <strong>Use Phase:</strong>{' '}
                            {lifecycle.lifecycleStages.usePhase}
                          </p>
                          <p>
                            <strong>End-of-Life:</strong>{' '}
                            {lifecycle.lifecycleStages.endOfLife}
                          </p>
                        </div>
                      </InfoRow>
                      <InfoRow
                        icon={Sparkles}
                        label="Improvement Opportunities"
                      >
                        <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                          {lifecycle.improvementOpportunities.map((opp, i) => (
                            <li key={i}>{opp}</li>
                          ))}
                        </ul>
                      </InfoRow>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Lifecycle analysis not available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Log details coming soon.</p>
                </CardContent>
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
