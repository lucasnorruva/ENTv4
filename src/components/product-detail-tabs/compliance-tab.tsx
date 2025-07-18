// src/components/product-detail-tabs/compliance-tab.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Fingerprint,
  FileQuestion,
  Link as LinkIcon,
  ShieldCheck,
  Stamp,
  Utensils,
  Recycle,
  Leaf,
  CalendarDays,
  ListTree,
  Diamond,
  Megaphone,
  Briefcase,
  Battery,
  TestTube2,
} from 'lucide-react';
import type { Product, CompliancePath, Certification, GreenClaim } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';

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
        {value && (
          <div className="text-muted-foreground text-sm">{value}</div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ComplianceTabProps {
  product: Product;
  compliancePath?: CompliancePath;
}

export default function ComplianceTab({
  product,
  compliancePath,
}: ComplianceTabProps) {
  const { sustainability, compliance, greenClaims } = product;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>
            Verification against selected compliance paths and regulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sustainability?.gaps && sustainability.gaps.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Potential Compliance Gaps Detected</AlertTitle>
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
          <InfoRow icon={FileQuestion} label="Assigned Compliance Path">
            {compliancePath ? (
              <>
                <p className="font-semibold text-foreground">
                  {compliancePath.name}
                </p>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full mt-2"
                >
                  <AccordionItem value="rules" className="border-none">
                    <AccordionTrigger className="text-xs p-0 hover:no-underline">
                      View Path Rules
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(compliancePath.rules, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">None selected</p>
            )}
          </InfoRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Declarations</CardTitle>
          <CardDescription>
            Specific compliance declarations made for this product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow icon={ShieldCheck} label="RoHS Compliant">
            <div className="text-sm text-muted-foreground">
              {compliance?.rohs?.compliant ? 'Yes' : 'No'}
              {compliance?.rohs?.exemption && (
                <span className="ml-2 text-xs">
                  (Exemption: {compliance.rohs.exemption})
                </span>
              )}
            </div>
          </InfoRow>
          <InfoRow icon={Stamp} label="CE Marked">
            <div className="text-sm text-muted-foreground">
              {compliance?.ce?.marked ? 'Yes' : 'No'}
            </div>
          </InfoRow>
          <InfoRow icon={Fingerprint} label="REACH SVHC & SCIP">
            <div className="text-sm text-muted-foreground">
              <p>SVHC Declared: {compliance?.reach?.svhcDeclared ? 'Yes' : 'No'}</p>
              <p>
                SCIP Ref:{' '}
                <span className="font-mono text-xs">
                  {compliance?.reach?.scipReference || 'N/A'}
                </span>
              </p>
            </div>
          </InfoRow>
          <InfoRow icon={Recycle} label="WEEE Compliance">
            <div className="text-sm text-muted-foreground">
              Registered:{' '}
              {compliance?.weee?.registered ? 'Yes' : 'No'}
              {compliance?.weee?.registrationNumber && (
                <span className="ml-2 font-mono text-xs">
                  ({compliance.weee.registrationNumber})
                </span>
              )}
            </div>
          </InfoRow>
           <InfoRow icon={Briefcase} label="Extended Producer Responsibility (EPR)">
            <div className="text-sm text-muted-foreground">
                Scheme ID: {compliance?.epr?.schemeId || 'N/A'}<br/>
                Producer No: {compliance?.epr?.producerRegistrationNumber || 'N/A'}<br/>
                Waste Category: {compliance?.epr?.wasteCategory || 'N/A'}
            </div>
          </InfoRow>
          <InfoRow icon={Leaf} label="EUDR Compliant">
            <div className="text-sm text-muted-foreground">
              {compliance?.eudr?.compliant ? 'Yes' : 'No'}
              {compliance?.eudr?.diligenceId && (
                <span className="ml-2 text-xs">
                  (Diligence ID: {compliance.eudr.diligenceId})
                </span>
              )}
            </div>
          </InfoRow>
           <InfoRow icon={Battery} label="EU Battery Regulation">
            <div className="text-sm text-muted-foreground">
              Compliant: {compliance?.battery?.compliant ? 'Yes' : 'No'}
              {compliance?.battery?.passportId && (
                <span className="ml-2 block mt-1 font-mono text-xs">
                  Passport ID: {compliance.battery.passportId}
                </span>
              )}
            </div>
          </InfoRow>
          <InfoRow icon={TestTube2} label="PFAS Declared">
             <div className="text-sm text-muted-foreground">
              {compliance?.pfas?.declared ? 'Yes' : 'No'}
            </div>
          </InfoRow>
          <InfoRow icon={Diamond} label="Conflict Minerals Compliant">
             <div className="text-sm text-muted-foreground">
              {compliance?.conflictMinerals?.compliant ? 'Yes' : 'No'}
              {compliance?.conflictMinerals?.reportUrl && (
                 <Button asChild variant="link" size="sm" className="h-auto p-0 ml-2">
                    <a
                        href={compliance.conflictMinerals.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs"
                    >
                        View Report <LinkIcon className="ml-1 h-3 w-3" />
                    </a>
                </Button>
              )}
            </div>
          </InfoRow>
          <InfoRow icon={Leaf} label="ESPR Compliant">
            <div className="text-sm text-muted-foreground">
              {compliance?.espr?.compliant ? 'Yes' : 'No'}
              {compliance?.espr?.delegatedActUrl && (
                <Button asChild variant="link" size="sm" className="h-auto p-0 ml-2">
                    <a
                        href={compliance.espr.delegatedActUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs"
                    >
                        View Delegated Act <LinkIcon className="ml-1 h-3 w-3" />
                    </a>
                </Button>
              )}
            </div>
          </InfoRow>
          <InfoRow icon={AlertTriangle} label="California Prop 65">
            <div className="text-sm text-muted-foreground">
              {compliance?.prop65?.warningRequired
                ? 'Warning Required'
                : 'No Warning Required'}
            </div>
          </InfoRow>
          <InfoRow icon={Utensils} label="Food Contact Safe">
            <div className="text-sm text-muted-foreground">
              {compliance?.foodContact?.safe ? 'Yes' : 'No'}
              {compliance?.foodContact?.standard && (
                <span className="ml-2 text-xs">
                  (Standard: {compliance.foodContact.standard})
                </span>
              )}
            </div>
          </InfoRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents & Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
             {greenClaims && greenClaims.length > 0 && (
                <AccordionItem value="green-claims">
                  <AccordionTrigger>
                    <h4 className="flex items-center gap-2 font-semibold">
                      <Megaphone />
                      Green Claims ({greenClaims.length})
                    </h4>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-3 mt-1">
                      {greenClaims.map((claim: GreenClaim, index: number) => (
                        <div key={index} className="text-sm p-3 border rounded-md bg-muted/50">
                          <p className="font-semibold text-foreground">{claim.claim}</p>
                          <p className="text-xs text-muted-foreground">Substantiation: {claim.substantiation}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
            )}
            <AccordionItem value="certs">
              <AccordionTrigger>
                <h4 className="flex items-center gap-2 font-semibold">
                  <ListTree />
                  Certifications ({product.certifications?.length || 0})
                </h4>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {product.certifications && product.certifications.length > 0 ? (
                  <div className="space-y-3 mt-1">
                    {product.certifications.map((cert: Certification, index: number) => (
                      <div key={index} className="text-sm p-3 border rounded-md bg-muted/50">
                        <p className="font-semibold text-foreground">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">Issued by: {cert.issuer}</p>
                        {cert.validUntil && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <CalendarDays className="h-3 w-3" />
                                Valid until: {format(new Date(cert.validUntil), 'PPP')}
                            </p>
                        )}
                        {cert.documentUrl && (
                             <Link
                                href={cert.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                            >
                                View Document <LinkIcon className="ml-1 h-3 w-3" />
                            </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4">
                    No certifications listed.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
            {product.declarationOfConformity && (
              <AccordionItem value="doc">
                <AccordionTrigger>
                  <h4 className="flex items-center gap-2 font-semibold">
                    <FileText />
                    Declaration of Conformity
                  </h4>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted p-4">
                    <ReactMarkdown>
                      {product.declarationOfConformity}
                    </ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
