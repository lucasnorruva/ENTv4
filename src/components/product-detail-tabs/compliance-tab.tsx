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
  FileJson, // Import new icon
} from 'lucide-react';
import type { Product, CompliancePath, Certification } from '@/types';
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
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';

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
  const { sustainability, compliance } = product;

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
          <Accordion type="single" collapsible className="w-full">
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
                                View Document <LinkIcon className="h-3 w-3" />
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
            {product.verifiableCredential && (
                 <AccordionItem value="vc">
                 <AccordionTrigger>
                   <h4 className="flex items-center gap-2 font-semibold">
                     <FileJson />
                     W3C Verifiable Credential
                   </h4>
                 </AccordionTrigger>
                 <AccordionContent className="pt-2">
                  <ScrollArea className="h-72 w-full rounded-md border bg-muted p-4">
                    <pre className="text-xs break-all whitespace-pre-wrap">
                        {product.verifiableCredential}
                    </pre>
                  </ScrollArea>
                 </AccordionContent>
               </AccordionItem>
            )}
            {product.blockchainProof && (
              <AccordionItem value="blockchain">
                <AccordionTrigger>
                  <h4 className="flex items-center gap-2 font-semibold">
                    <Fingerprint />
                    On-Chain Proof
                  </h4>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                   <Link
                    href={product.blockchainProof.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    View Polygon Transaction
                    <LinkIcon className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
