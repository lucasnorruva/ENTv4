// src/components/product-detail-tabs/compliance-tab.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
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
} from 'lucide-react';
import type { Product, CompliancePath } from '@/types';
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
          <CardTitle>Documents & Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow icon={FileText} label="Certifications">
            {product.certifications && product.certifications.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {product.certifications.map((cert: any, index: number) => (
                  <li key={index}>
                    {cert.name} (by {cert.issuer})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No certifications listed.
              </p>
            )}
          </InfoRow>
          {product.declarationOfConformity && (
            <InfoRow
              icon={FileText}
              label="Generated Declaration of Conformity"
            >
              <Card className="mt-2 bg-muted/50">
                <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none text-xs">
                  <ReactMarkdown>
                    {product.declarationOfConformity}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </InfoRow>
          )}
        </CardContent>
      </Card>

      {product.blockchainProof && (
        <Card>
          <CardHeader>
            <CardTitle>On-Chain Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={Fingerprint} label="Polygon Transaction">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
