// src/components/product-detail-view.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
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
  HeartPulse,
  BatteryCharging,
  Zap,
  Weight,
  Layers,
  Copyright,
  Utensils,
} from 'lucide-react';

import type { Product, User, CompliancePath, AuditLog } from '@/types';
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
import { AuditLogTimeline } from './audit-log-timeline';
import AiSuggestionsWidget from './ai-suggestions-widget';

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
  auditLogs,
}: {
  product: Product;
  user: User;
  compliancePath?: CompliancePath;
  auditLogs: AuditLog[];
}) {
  const { sustainability } = product;
  const esg = sustainability;
  const aiLifecycle = sustainability?.lifecycleAnalysis;

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
              <TabsTrigger value="log">Audit Log</TabsTrigger>
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
                      {product.gtin && (
                        <InfoRow
                          icon={Fingerprint}
                          label="GTIN"
                          value={<span className="font-mono">{product.gtin}</span>}
                        />
                      )}
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
                      {product.conformityDocUrl && (
                        <InfoRow icon={FileText} label="Declaration of Conformity">
                          <Link
                            href={product.conformityDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            View Document
                            <LinkIcon className="h-3 w-3" />
                          </Link>
                        </InfoRow>
                      )}
                    </div>
                  </div>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full mt-4"
                  >
                    <AccordionItem value="data">
                      <AccordionTrigger>
                        Materials, Manufacturing & Packaging
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
                        <InfoRow icon={Package} label="Packaging">
                          <p className="text-sm text-muted-foreground">
                            {product.packaging?.type}
                            {product.packaging?.weight &&
                              ` (${product.packaging.weight}g)`}
                            . Recyclable:{' '}
                            {product.packaging?.recyclable ? 'Yes' : 'No'}.
                          </p>
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
                    value={
                      sustainability?.complianceSummary || 'Awaiting review.'
                    }
                  />
                  <InfoRow icon={ShieldCheck} label="RoHS Compliant">
                    <p className="text-sm text-muted-foreground">
                      {product.compliance?.rohsCompliant ? 'Yes' : 'No'}
                      {product.compliance?.rohsExemption && (
                        <span className="ml-2 text-xs">
                          (Exemption: {product.compliance.rohsExemption})
                        </span>
                      )}
                    </p>
                  </InfoRow>
                   <InfoRow icon={Copyright} label="CE Marked">
                    <p className="text-sm text-muted-foreground">
                      {product.compliance?.ceMarked ? 'Yes' : 'No'}
                    </p>
                  </InfoRow>
                   <InfoRow icon={Utensils} label="Food Contact Safe">
                    <p className="text-sm text-muted-foreground">
                      {product.compliance?.foodContactSafe ? 'Yes' : 'No'}
                       {product.compliance?.foodContactComplianceStandard && (
                        <span className="ml-2 text-xs">
                          (Standard: {product.compliance.foodContactComplianceStandard})
                        </span>
                      )}
                    </p>
                  </InfoRow>
                   <InfoRow icon={AlertTriangle} label="Prop 65 Warning">
                    <p className="text-sm text-muted-foreground">
                      {product.compliance?.prop65WarningRequired ? 'Required' : 'Not Required'}
                    </p>
                  </InfoRow>
                  <InfoRow icon={Recycle} label="WEEE Compliance">
                    <p className="text-sm text-muted-foreground">
                      Registered: {product.compliance?.weeeRegistered ? 'Yes' : 'No'}
                      {product.compliance?.weeeRegistrationNumber && (
                        <span className="ml-2 font-mono text-xs">
                          ({product.compliance.weeeRegistrationNumber})
                        </span>
                      )}
                    </p>
                  </InfoRow>
                  <InfoRow icon={ShieldCheck} label="EUDR Compliant">
                    <p className="text-sm text-muted-foreground">
                      {product.compliance?.eudrCompliant ? 'Yes' : 'No'}
                      {product.compliance?.eudrDiligenceId && (
                        <span className="ml-2 text-xs">
                          (Diligence ID: {product.compliance.eudrDiligenceId})
                        </span>
                      )}
                    </p>
                  </InfoRow>
                  <InfoRow icon={FileText} label="SCIP Reference">
                    <p className="font-mono text-xs text-muted-foreground">
                      {product.compliance?.scipReference || 'Not Provided'}
                    </p>
                  </InfoRow>
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
                  <CardTitle>Lifecycle & Circularity</CardTitle>
                  <CardDescription>
                    Data related to the product's lifespan, repairability, and
                    end-of-life.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-x-6">
                    <InfoRow
                      icon={Thermometer}
                      label="Carbon Footprint"
                      value={
                        product.lifecycle?.carbonFootprint
                          ? `${product.lifecycle.carbonFootprint} kg CO2-eq`
                          : 'Not available'
                      }
                    >
                      {product.lifecycle?.carbonFootprintMethod && (
                        <p className="text-xs text-muted-foreground">
                          Method: {product.lifecycle.carbonFootprintMethod}
                        </p>
                      )}
                    </InfoRow>
                    <InfoRow
                      icon={HeartPulse}
                      label="Expected Lifespan"
                      value={
                        product.lifecycle?.expectedLifespan
                          ? `${product.lifecycle.expectedLifespan} years`
                          : 'Not available'
                      }
                    />
                    <InfoRow
                      icon={Wrench}
                      label="Repairability Score"
                      value={
                        product.lifecycle?.repairabilityScore
                          ? `${product.lifecycle.repairabilityScore} / 10`
                          : 'Not available'
                      }
                    />
                     <InfoRow
                      icon={Lightbulb}
                      label="Energy Efficiency Class"
                      value={
                        product.lifecycle?.energyEfficiencyClass ?
                        <Badge variant="outline">{product.lifecycle.energyEfficiencyClass}</Badge>
                        : 'Not available'
                      }
                    />
                    {product.battery && (
                      <InfoRow
                        icon={BatteryCharging}
                        label="Battery"
                        value={`${product.battery.type || 'N/A'}${
                          product.battery.capacityMah
                            ? `, ${product.battery.capacityMah}mAh`
                            : ''
                        }`}
                      >
                        <p className="text-xs text-muted-foreground">
                          Removable:{' '}
                          {product.battery.isRemovable ? 'Yes' : 'No'}
                        </p>
                      </InfoRow>
                    )}
                     <InfoRow
                      icon={Recycle}
                      label="Recycling Instructions"
                      value={product.lifecycle?.recyclingInstructions || 'Not provided.'}
                    />
                  </div>
                  {aiLifecycle && (
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full mt-4"
                    >
                      <AccordionItem value="ai-analysis">
                        <AccordionTrigger>AI Lifecycle Analysis</AccordionTrigger>
                        <AccordionContent>
                          <InfoRow
                            icon={Lightbulb}
                            label="AI Stage Analysis"
                          >
                            <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                              <p>
                                <strong>Manufacturing:</strong>{' '}
                                {aiLifecycle.lifecycleStages.manufacturing}
                              </p>
                              <p>
                                <strong>Use Phase:</strong>{' '}
                                {aiLifecycle.lifecycleStages.usePhase}
                              </p>
                              <p>
                                <strong>End-of-Life:</strong>{' '}
                                {aiLifecycle.lifecycleStages.endOfLife}
                              </p>
                            </div>
                          </InfoRow>
                          <InfoRow
                            icon={Sparkles}
                            label="AI Improvement Opportunities"
                          >
                            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                              {aiLifecycle.improvementOpportunities.map(
                                (opp, i) => (
                                  <li key={i}>{opp}</li>
                                ),
                              )}
                            </ul>
                          </InfoRow>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log" className="mt-4">
              <AuditLogTimeline logs={auditLogs} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">
          <DppQrCodeWidget productId={product.id} />
          <AiSuggestionsWidget product={product} />
          <DppCompletenessWidget product={product} />
        </div>
      </div>
    </div>
  );
}
